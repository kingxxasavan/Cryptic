// What the models are told. The recipe rules here must match what
// lib/geometry/build.ts builds and lib/recipe/validate.ts accepts.
import type { Fact, Part, Project, Param } from "@/lib/recipe/types";
import { MATERIALS } from "@/lib/geometry/measure";

export interface Msg { role: "system" | "user" | "assistant"; content: string }

export function clipBrief(brief: string, max = 24000): string {
  const b = String(brief || "").trim();
  if (b.length <= max) return b;
  const half = Math.floor((max - 40) / 2);
  return b.slice(0, half) + "\n\n[… middle of the brief left out …]\n\n" + b.slice(-half);
}

export const RECIPE_RULES = `
RECIPE FORMAT (JSON). Units: millimetres and degrees. Z is up.
A part: {"id","name","purpose","attachesTo":[part ids],"material","color":"#rrggbb","finish":"matte|satin|gloss|metal|clear",
 "position":[x,y,z] (where the part's origin sits in the assembly, mm), "rotation":[x,y,z] (degrees),
 "params": {"name": {"value":n,"min":n,"max":n,"unit":"mm|deg|count","source":"researched|estimated","factId":"f3","note":"…"}},
 "shape": NODE}
Every size a person might want to change is a param. In shapes, any number may be a param name or an expression
using + - * / ( ) min() max() and params ("length - 2*wall"). Param names: letters, digits, _.
NODE types (each centred on the origin unless said otherwise):
 {"type":"box","w","d","h"}                 x width, y depth, z height
 {"type":"cylinder","d","h"}                along Z
 {"type":"tube","od","id","h"}              hollow cylinder along Z (id < od)
 {"type":"sphere","d"}
 {"type":"cone","d1","d2","h"}              d1 at the bottom, d2 at the top, along Z
 {"type":"torus","D","d"}                   ring in the XY plane, D = ring diameter, d = tube diameter
 {"type":"extrude","points":[[x,y],…],"h"}  outline in XY (counter clockwise, no crossing), extruded along Z, centred on Z
 {"type":"revolve","points":[[r,z],…],"angle"?} profile with r ≥ 0 spun around Z
 {"type":"hull","children":[NODE,…]}        smooth wrap around the children (great for rounded, organic parts: hull of spheres/cylinders)
 {"type":"union","children":[…]} {"type":"subtract","children":[first, minus, these…]} {"type":"intersect","children":[…]}
 {"type":"translate","by":[x,y,z],"child":NODE} {"type":"rotate","by":[x,y,z],"child":NODE}
 {"type":"mirror","axis":"x|y|z","child":NODE} {"type":"array","count":n,"step":[x,y,z],"child":NODE}
Holes and cutouts: subtract a slightly longer shape than the wall (e.g. h + 1) so the cut goes all the way through.
Rounded edges: hull of spheres or cylinders placed at the corners.
Materials with known weights: ${MATERIALS.map((m) => m.name).join(", ")}.
Keep parts printable and realistic: walls at least 1.2 mm for plastic, screw holes sized for real screws (M1.4 → 1.5 mm, M2 → 2.2 mm clearance).
Max 60 parts, 200 shapes per part.`.trim();

const EXAMPLE = `Example part:
{"id":"hinge_barrel","name":"Hinge barrel","purpose":"Lets the temple arm fold","attachesTo":["frame_front","temple_left"],
 "material":"Stainless steel","color":"#b8bcc4","finish":"metal","position":[68,0,0],"rotation":[0,0,0],
 "params":{"od":{"value":3,"min":2,"max":5,"unit":"mm","source":"researched","factId":"f2"},
           "length":{"value":6,"min":4,"max":10,"unit":"mm","source":"estimated"},
           "pin":{"value":1.5,"min":1,"max":2.5,"unit":"mm","source":"researched","factId":"f2","note":"clearance for an M1.4 screw"}},
 "shape":{"type":"subtract","children":[{"type":"cylinder","d":"od","h":"length"},{"type":"cylinder","d":"pin","h":"length + 1"}]}}`;

export function factsBlock(facts: Fact[]): string {
  if (!facts.length) return "RESEARCH: no research came back. Mark every size \"estimated\" and use typical real world sizes.";
  return "RESEARCH (cite by factId when a size comes from one):\n" + facts.map((f) => `[${f.id}] ${f.text} (${f.url})`).join("\n");
}

export function queryMessages(description: string, brief: string): Msg[] {
  return [
    { role: "system", content: "You plan web research for designing a physical product's parts. Reply with JSON only: {\"queries\":[\"…\"]}. 3 to 6 short search queries that would find real dimensions, standard part sizes and how such products are built (e.g. \"eyeglasses temple length mm\", \"eyeglass hinge screw size\")." },
    { role: "user", content: `Product: ${description}\n\nBrief:\n${clipBrief(brief, 4000)}` },
  ];
}

export function factMessages(description: string, pages: { url: string; title: string; text: string }[]): Msg[] {
  return [
    { role: "system", content: "Extract facts useful for designing the product's parts: dimensions with units, standard part sizes, materials, how parts attach. Only facts stated in the pages; no guesses. Reply with JSON only: {\"facts\":[{\"text\":\"…\",\"url\":\"…\",\"title\":\"…\"}]} with at most 25 facts, each one sentence with numbers and units." },
    { role: "user", content: `Product: ${description}\n\n` + pages.map((p, i) => `PAGE ${i + 1}: ${p.title} (${p.url})\n${p.text.slice(0, 6000)}`).join("\n\n") },
  ];
}

export function designMessages(o: { description: string; brief: string; facts: Fact[]; name?: string }): Msg[] {
  return [
    { role: "system", content: `You are a mechanical and product designer. Design every physical part of the product as a 3D recipe that a geometry engine will build exactly.\n\n${RECIPE_RULES}\n\n${EXAMPLE}\n\nPlace the parts so they assemble correctly (positions in mm). Give each part a clear purpose and which parts it attaches to. Use the owner's brief for intent, constraints, and anything they decided. Use researched sizes where you have them (source "researched" with its factId), otherwise "estimated".\nReply with JSON only: {"name":"…","parts":[PART,…]}` },
    { role: "user", content: `PRODUCT: ${o.description}${o.name ? `\nNAME: ${o.name}` : ""}\n\nOWNER'S BRIEF (brainstorms, plans, constraints):\n${clipBrief(o.brief) || "(none)"}\n\n${factsBlock(o.facts)}` },
  ];
}

export function editMessages(o: { project: Project; selected?: string | null; request: string; recent?: Msg[] }): Msg[] {
  const compact = { name: o.project.name, parts: o.project.parts.map((p) => ({ ...p, realistic: undefined })) };
  return [
    { role: "system", content: `You edit a 3D product made of recipe parts. Change only what the request asks.\n\n${RECIPE_RULES}\n\nReply with JSON only: {"message":"one or two sentences on what you changed","changes":[CHANGE,…]}\nCHANGE is one of:\n {"op":"set_param","part":"id","name":"param","value":n}\n {"op":"add_param","part":"id","name":"param","param":{"value":n,"min":n,"max":n,"unit":"mm","source":"estimated"}}\n {"op":"set","part":"id","field":"name|purpose|attachesTo|material|color|finish|visible|position|rotation","value":…}\n {"op":"replace_shape","part":"id","shape":NODE,"params":{…new or changed params}}\n {"op":"add_part","part":PART}\n {"op":"remove_part","part":"id"}\n {"op":"rename_project","name":"…"}\nPrefer set_param when a size already exists. When adding a part, place it where it attaches.` },
    ...(o.recent || []).slice(-6),
    { role: "user", content: `PROJECT:\n${JSON.stringify(compact)}\n\n${factsBlock(o.project.research)}\n\nBRIEF:\n${clipBrief(o.project.brief, 6000) || "(none)"}\n\nSELECTED PART: ${o.selected ? JSON.stringify(o.selected) : "none (the request is about the whole project)"}\n\nREQUEST: ${o.request}` },
  ];
}

export function repairMessages(previous: Msg[], reply: string, errors: string[]): Msg[] {
  return [...previous, { role: "assistant", content: reply.slice(0, 30000) }, { role: "user", content: `That JSON has problems:\n- ${errors.slice(0, 12).join("\n- ")}\nFix them and reply with the complete corrected JSON only.` }];
}

const slug = (s: string) => String(s || "part").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "part";

/** Turn the model's design into a full project: ids, defaults, facts, and no fake citations. */
export function finishProject(raw: unknown, o: { description: string; brief: string; facts: Fact[]; id: string; name?: string }): Project {
  const r = (raw && typeof raw === "object" ? raw : {}) as { name?: string; parts?: Partial<Part>[] };
  const factIds = new Set(o.facts.map((f) => f.id));
  const used = new Set<string>();
  const parts = (Array.isArray(r.parts) ? r.parts : []).slice(0, 60).map((p) => {
    let id = slug(p.id || p.name || "part");
    while (used.has(id)) id += "_2";
    used.add(id);
    const params: Record<string, Param> = {};
    for (const [k, v] of Object.entries(p.params || {})) {
      const q = { ...(v as Param) };
      if (q.source === "researched" && !(q.factId && factIds.has(q.factId))) { q.source = "estimated"; delete q.factId; }
      if (typeof q.min !== "number") q.min = 0;
      if (typeof q.max !== "number") q.max = Math.max(1, (Number(q.value) || 1) * 3);
      if (!q.unit) q.unit = "mm";
      params[k] = q;
    }
    return {
      id, name: String(p.name || id).slice(0, 80), purpose: String(p.purpose || ""), attachesTo: Array.isArray(p.attachesTo) ? p.attachesTo.map(slug) : [],
      material: String(p.material || "PLA"), color: /^#[0-9a-f]{6}$/i.test(String(p.color)) ? String(p.color) : "#9aa0aa",
      finish: (["matte", "satin", "gloss", "metal", "clear"].includes(String(p.finish)) ? p.finish : "matte") as Part["finish"],
      visible: true, position: (Array.isArray(p.position) && p.position.length === 3 ? p.position.map(Number) : [0, 0, 0]) as Part["position"],
      rotation: (Array.isArray(p.rotation) && p.rotation.length === 3 ? p.rotation.map(Number) : [0, 0, 0]) as Part["rotation"],
      params, shape: p.shape as Part["shape"],
    } satisfies Part;
  });
  const known = new Set(parts.map((p) => p.id));
  parts.forEach((p) => { p.attachesTo = p.attachesTo.filter((a) => known.has(a) && a !== p.id); });
  const now = Date.now();
  return { v: 1, id: o.id, name: String(o.name || r.name || o.description || "Untitled").slice(0, 120), description: o.description, brief: o.brief, parts, research: o.facts, createdAt: now, updatedAt: now };
}
