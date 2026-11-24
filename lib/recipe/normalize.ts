// The Realtime Database drops empty lists and objects and can hand lists back
// as numbered objects. This puts a stored project back into the shape the
// rest of the app expects, before validation.
import type { Project } from "./types";

const list = (x: unknown): unknown[] => Array.isArray(x) ? x : x && typeof x === "object" ? Object.keys(x).sort((a, b) => +a - +b).map((k) => (x as Record<string, unknown>)[k]) : [];

function fixNode(n: unknown): unknown {
  if (!n || typeof n !== "object") return n;
  const node = { ...(n as Record<string, unknown>) };
  if ("children" in node) node.children = list(node.children).map(fixNode);
  if ("child" in node) node.child = fixNode(node.child);
  if ("points" in node) node.points = list(node.points).map(list);
  for (const k of ["by", "step"]) if (k in node) node[k] = list(node[k]);
  return node;
}

export function normalizeProject(raw: unknown): Project {
  const p = { ...(raw as Record<string, unknown>) };
  p.research = list(p.research);
  p.brief = typeof p.brief === "string" ? p.brief : "";
  p.description = typeof p.description === "string" ? p.description : "";
  p.parts = list(p.parts).map((x) => {
    const part = { ...(x as Record<string, unknown>) };
    part.attachesTo = list(part.attachesTo);
    part.params = part.params && typeof part.params === "object" ? part.params : {};
    part.position = list(part.position);
    part.rotation = list(part.rotation);
    part.purpose = typeof part.purpose === "string" ? part.purpose : "";
    part.visible = part.visible !== false;
    part.shape = fixNode(part.shape);
    return part;
  });
  return p as unknown as Project;
}
