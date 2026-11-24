// Starter shapes for "+ Add". Each comes with named sizes, so sliders work
// straight away.
import type { Node, Param, Part } from "@/lib/recipe/types";

const mm = (value: number, min: number, max: number): Param => ({ value, min, max, unit: "mm", source: "estimated" });
const base = (id: string, name: string, params: Record<string, Param>, shape: Node, extra: Partial<Part> = {}): Part => ({
  id, name, purpose: "", attachesTo: [], material: "PLA", color: "#8a8f9c", finish: "matte", visible: true, position: [0, 0, 60], rotation: [0, 0, 0], params, shape, ...extra,
});

export const LIBRARY: { name: string; make: (id: string) => Part }[] = [
  { name: "Box", make: (id) => base(id, "Box", { w: mm(20, 1, 200), d: mm(20, 1, 200), h: mm(10, 1, 200) }, { type: "box", w: "w", d: "d", h: "h" }) },
  { name: "Cylinder", make: (id) => base(id, "Cylinder", { d: mm(16, 1, 200), h: mm(20, 1, 200) }, { type: "cylinder", d: "d", h: "h" }) },
  { name: "Tube", make: (id) => base(id, "Tube", { od: mm(16, 2, 200), id: mm(12, 1, 199), h: mm(20, 1, 200) }, { type: "tube", od: "od", id: "id", h: "h" }) },
  { name: "Sphere", make: (id) => base(id, "Sphere", { d: mm(16, 1, 200) }, { type: "sphere", d: "d" }) },
  { name: "Rounded plate", make: (id) => base(id, "Rounded plate", { w: mm(40, 6, 300), d: mm(25, 6, 300), t: mm(3, 0.8, 20), r: mm(3, 0.5, 20) },
    { type: "hull", children: ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) => ({ type: "translate" as const, by: [`${sx} * (w / 2 - r)`, `${sy} * (d / 2 - r)`, 0] as [string, string, number], child: { type: "cylinder" as const, d: "r * 2", h: "t" } })) }) },
  { name: "Plate with 4 holes", make: (id) => base(id, "Mounting plate", { w: mm(40, 10, 300), d: mm(30, 10, 300), t: mm(3, 1, 20), hole: mm(2.2, 1, 10), inset: mm(4, 2, 30) },
    { type: "subtract", children: [{ type: "box", w: "w", d: "d", h: "t" },
      ...([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) => ({ type: "translate" as const, by: [`${sx} * (w / 2 - inset)`, `${sy} * (d / 2 - inset)`, 0] as [string, string, number], child: { type: "cylinder" as const, d: "hole", h: "t + 1" } }))] }) },
  { name: "L bracket", make: (id) => base(id, "L bracket", { w: mm(20, 4, 200), leg: mm(25, 5, 200), t: mm(3, 1, 20) },
    { type: "union", children: [
      { type: "translate", by: [0, 0, "t / 2"], child: { type: "box", w: "w", d: "leg", h: "t" } },
      { type: "translate", by: [0, "-(leg / 2 - t / 2)", "leg / 2"], child: { type: "box", w: "w", d: "t", h: "leg" } }] }) },
  { name: "Ring", make: (id) => base(id, "Ring", { D: mm(24, 4, 300), d: mm(4, 1, 50) }, { type: "torus", D: "D", d: "d" }) },
  { name: "Screw (M2)", make: (id) => base(id, "M2 screw", { len: mm(6, 2, 40), head: mm(3.8, 2, 8), head_h: mm(1.3, 0.5, 4), shaft: mm(2, 1, 6) },
    { type: "union", children: [{ type: "translate", by: [0, 0, "head_h / 2"], child: { type: "cylinder", d: "head", h: "head_h" } }, { type: "translate", by: [0, 0, "-len / 2"], child: { type: "cylinder", d: "shaft", h: "len" } }] },
    { material: "Stainless steel", color: "#b8bcc4", finish: "metal" }) },
];
