// Checks a project before it's built, saved or accepted from the AI. Every
// problem comes back as a sentence that names the part, so the AI can repair
// it and a person can read it.
import { LIMITS, NODE_TYPES, type Node, type Part, type Project } from "./types";
import { ExprError, evalExpr, namesIn } from "./expr";

export type Validated = { ok: true; project: Project } | { ok: false; errors: string[] };

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const FINISHES = ["matte", "satin", "gloss", "metal", "clear"];

export function paramValues(part: Pick<Part, "params">): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, p] of Object.entries(part.params || {})) out[k] = Number(p.value);
  return out;
}

const NUM_FIELDS: Record<string, string[]> = {
  box: ["w", "d", "h"], cylinder: ["d", "h"], tube: ["od", "id", "h"], sphere: ["d"], cone: ["d1", "d2", "h"],
  torus: ["D", "d"], extrude: ["h"], revolve: [], array: ["count"],
};

function checkNode(node: unknown, where: string, params: Record<string, number>, errors: string[], count: { n: number }) {
  count.n++;
  if (count.n > LIMITS.nodes) { if (count.n === LIMITS.nodes + 1) errors.push(`${where}: more than ${LIMITS.nodes} shapes`); return; }
  if (!isObj(node) || typeof node.type !== "string") { errors.push(`${where}: a shape is missing its type`); return; }
  const type = node.type as Node["type"];
  if (!NODE_TYPES.includes(type)) { errors.push(`${where}: unknown shape "${String(node.type)}" (use ${NODE_TYPES.join(", ")})`); return; }
  const num = (v: unknown, field: string) => {
    if (typeof v !== "number" && typeof v !== "string") { errors.push(`${where} ${type}.${field}: missing a size`); return; }
    for (const n of namesIn(v)) if (!(n in params)) errors.push(`${where} ${type}.${field}: unknown size "${n}"`);
    try { evalExpr(v, params); } catch (e) { if (e instanceof ExprError && !/unknown size/.test(e.message)) errors.push(`${where} ${type}.${field}: ${e.message}`); }
  };
  for (const f of NUM_FIELDS[type] || []) num(node[f], f);
  if (type === "extrude" || type === "revolve") {
    const pts = node.points;
    if (!Array.isArray(pts) || pts.length < 3 || pts.length > LIMITS.points) errors.push(`${where} ${type}: needs 3 to ${LIMITS.points} points`);
    else pts.forEach((p, i) => { if (!Array.isArray(p) || p.length !== 2) errors.push(`${where} ${type}.points[${i}]: needs [x, y]`); else { num(p[0], `points[${i}][0]`); num(p[1], `points[${i}][1]`); } });
    if (type === "revolve" && node.angle !== undefined) num(node.angle, "angle");
  }
  if (type === "hull" || type === "union" || type === "subtract" || type === "intersect") {
    const kids = node.children;
    if (!Array.isArray(kids) || kids.length < (type === "hull" ? 1 : 2)) { errors.push(`${where} ${type}: needs ${type === "hull" ? "at least 1 shape" : "at least 2 shapes"} in children`); return; }
    kids.forEach((k, i) => checkNode(k, `${where}/${type}[${i}]`, params, errors, count));
  }
  if (type === "translate" || type === "rotate" || type === "array") {
    const v = type === "array" ? node.step : node.by;
    if (!Array.isArray(v) || v.length !== 3) errors.push(`${where} ${type}: needs ${type === "array" ? "step" : "by"} as [x, y, z]`);
    else v.forEach((x, i) => num(x, `${type === "array" ? "step" : "by"}[${i}]`));
  }
  if (type === "mirror" && !["x", "y", "z"].includes(String(node.axis))) errors.push(`${where} mirror: axis must be x, y or z`);
  if (type === "translate" || type === "rotate" || type === "mirror" || type === "array") checkNode(node.child, `${where}/${type}`, params, errors, count);
}

function checkPart(part: unknown, i: number, errors: string[], ids: Set<string>) {
  if (!isObj(part)) { errors.push(`part ${i + 1}: not an object`); return; }
  const label = `"${String(part.name || part.id || "part " + (i + 1))}"`;
  if (typeof part.id !== "string" || !ID.test(part.id)) errors.push(`${label}: id must be letters, numbers, - or _`);
  else if (ids.has(part.id)) errors.push(`${label}: id "${part.id}" is used twice`);
  else ids.add(part.id);
  if (typeof part.name !== "string" || !part.name.trim() || part.name.length > 80) errors.push(`${label}: needs a name up to 80 characters`);
  if (typeof part.color !== "string" || !HEX.test(part.color)) errors.push(`${label}: color must be like #1a2b3c`);
  if (typeof part.material !== "string" || part.material.length > 40) errors.push(`${label}: material must be text`);
  if (part.finish !== undefined && !FINISHES.includes(String(part.finish))) errors.push(`${label}: finish must be one of ${FINISHES.join(", ")}`);
  for (const f of ["position", "rotation"] as const) {
    const v = part[f];
    if (!Array.isArray(v) || v.length !== 3 || !v.every(x => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= LIMITS.size * 2)) errors.push(`${label}: ${f} must be [x, y, z] numbers`);
  }
  if (!Array.isArray(part.attachesTo)) errors.push(`${label}: attachesTo must be a list`);
  const params: Record<string, number> = {};
  if (!isObj(part.params)) errors.push(`${label}: params must be an object`);
  else for (const [k, p] of Object.entries(part.params)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,40}$/.test(k)) { errors.push(`${label}: size name "${k}" must be letters, numbers and _`); continue; }
    if (!isObj(p) || typeof p.value !== "number" || !Number.isFinite(p.value)) { errors.push(`${label}: size "${k}" needs a number value`); continue; }
    if (typeof p.min !== "number" || typeof p.max !== "number" || p.min > p.max) errors.push(`${label}: size "${k}" needs min ≤ max`);
    if (!["mm", "deg", "count"].includes(String(p.unit))) errors.push(`${label}: size "${k}" unit must be mm, deg or count`);
    if (!["researched", "estimated"].includes(String(p.source))) errors.push(`${label}: size "${k}" source must be researched or estimated`);
    params[k] = p.value;
  }
  checkNode(part.shape, label, params, errors, { n: 0 });
}

export function validateProject(x: unknown): Validated {
  const errors: string[] = [];
  if (!isObj(x)) return { ok: false, errors: ["not a project"] };
  if (x.v !== 1) errors.push("version must be 1");
  if (typeof x.name !== "string" || !x.name.trim() || x.name.length > 120) errors.push("the project needs a name up to 120 characters");
  if (typeof x.brief !== "string" || x.brief.length > LIMITS.brief) errors.push(`the brief must be text up to ${LIMITS.brief} characters`);
  if (!Array.isArray(x.parts)) errors.push("parts must be a list");
  else if (x.parts.length > LIMITS.parts) errors.push(`at most ${LIMITS.parts} parts`);
  else { const ids = new Set<string>(); x.parts.forEach((p, i) => checkPart(p, i, errors, ids)); }
  if (!Array.isArray(x.research)) errors.push("research must be a list");
  return errors.length ? { ok: false, errors } : { ok: true, project: x as unknown as Project };
}
