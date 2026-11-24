import { beforeAll, describe, expect, it } from "vitest";
import Module from "manifold-3d/manifold";
import { buildPart, type Wasm } from "@/lib/geometry/build";
import type { Node, Part } from "@/lib/recipe/types";

let wasm: Wasm;
beforeAll(async () => { wasm = await Module(); wasm.setup(); });

const part = (shape: Node, params: Record<string, number> = {}): Part => ({
  id: "p", name: "P", purpose: "", attachesTo: [], material: "PLA", color: "#888888", finish: "matte", visible: true,
  position: [0, 0, 0], rotation: [0, 0, 0], shape,
  params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, { value: v, min: 0, max: 1000, unit: "mm" as const, source: "estimated" as const }])),
});

describe("buildPart", () => {
  it("a box, centred, with its sizes from params", () => {
    const r = buildPart(wasm, part({ type: "box", w: "w", d: 20, h: "w * 3" }, { w: 10 }));
    if ("error" in r) throw new Error(r.error);
    expect(r.volume).toBeCloseTo(6000, 3);
    expect(r.bbox.min).toEqual([-5, -10, -15]);
    expect(r.mesh.indices.length / 3).toBe(12);
  });
  it("a tube is a cylinder with a hole", () => {
    const r = buildPart(wasm, part({ type: "tube", od: 10, id: 6, h: 10, segments: 128 }));
    if ("error" in r) throw new Error(r.error);
    expect(r.volume / (Math.PI * (25 - 9) * 10)).toBeCloseTo(1, 2);
  });
  it("subtract takes the later shapes out of the first", () => {
    const r = buildPart(wasm, part({ type: "subtract", children: [{ type: "box", w: 10, d: 10, h: 10 }, { type: "box", w: 4, d: 4, h: 20 }] }));
    if ("error" in r) throw new Error(r.error);
    expect(r.volume).toBeCloseTo(1000 - 160, 3);
  });
  it("extrudes a polygon and arrays copies", () => {
    const sq = { type: "extrude" as const, points: [[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][], h: 2 };
    const one = buildPart(wasm, part(sq));
    const three = buildPart(wasm, part({ type: "array", count: 3, step: [20, 0, 0], child: sq }));
    if ("error" in one || "error" in three) throw new Error("build failed");
    expect(one.volume).toBeCloseTo(200, 3);
    expect(three.volume).toBeCloseTo(600, 3);
  });
  it("a hull of two spheres is one closed solid", () => {
    const r = buildPart(wasm, part({ type: "hull", children: [
      { type: "sphere", d: 6 }, { type: "translate", by: [40, 0, 0], child: { type: "sphere", d: 6 } }] }));
    if ("error" in r) throw new Error(r.error);
    expect(r.bbox.max[0]).toBeGreaterThan(42);
    expect(r.volume).toBeGreaterThan(0);
  });
  it("revolve, torus, cone, rotate and mirror build", () => {
    for (const s of [
      { type: "revolve", points: [[2, 0], [5, 0], [5, 10], [2, 10]] },
      { type: "torus", D: 20, d: 4 },
      { type: "cone", d1: 10, d2: 4, h: 8 },
      { type: "rotate", by: [90, 0, 0], child: { type: "box", w: 1, d: 2, h: 3 } },
      { type: "mirror", axis: "x", child: { type: "translate", by: [5, 0, 0], child: { type: "box", w: 1, d: 1, h: 1 } } },
    ] as Node[]) {
      const r = buildPart(wasm, part(s));
      expect("error" in r ? r.error : "").toBe("");
    }
  });
  it("a zero or negative size is an error, not a crash", () => {
    const r = buildPart(wasm, part({ type: "box", w: "w", d: 10, h: 10 }, { w: 0 }));
    expect("error" in r && r.error).toMatch(/w/);
    const s = buildPart(wasm, part({ type: "cylinder", d: -3, h: 10 }));
    expect("error" in s).toBe(true);
  });
  it("an unknown size is an error", () => {
    const r = buildPart(wasm, part({ type: "box", w: "nope", d: 1, h: 1 }));
    expect("error" in r && r.error).toMatch(/nope/);
  });
});
