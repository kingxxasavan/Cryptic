import { describe, expect, it } from "vitest";
import { validateProject, paramValues } from "@/lib/recipe/validate";
import type { Project } from "@/lib/recipe/types";

export const tiny = (): Project => ({
  v: 1, id: "p1", name: "Test", description: "", brief: "", research: [], createdAt: 1, updatedAt: 1,
  parts: [{
    id: "arm", name: "Temple arm", purpose: "", attachesTo: [], material: "PLA", color: "#222222", finish: "matte", visible: true,
    position: [0, 0, 0], rotation: [0, 0, 0],
    params: { length: { value: 140, min: 100, max: 160, unit: "mm", source: "estimated" }, wall: { value: 3, min: 1, max: 6, unit: "mm", source: "estimated" } },
    shape: { type: "box", w: "length", d: "wall", h: 8 },
  }],
});

describe("validateProject", () => {
  it("accepts a minimal valid project", () => {
    const r = validateProject(tiny());
    expect(r.ok).toBe(true);
  });
  it("rejects an unknown node type, saying where", () => {
    const p = tiny(); (p.parts[0] as unknown as { shape: unknown }).shape = { type: "teapot" };
    const r = validateProject(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/Temple arm.*teapot/);
  });
  it("rejects an expression naming a missing param", () => {
    const p = tiny(); p.parts[0].shape = { type: "box", w: "length", d: "thickness", h: 8 };
    const r = validateProject(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/thickness/);
  });
  it("rejects more than 60 parts", () => {
    const p = tiny(); p.parts = Array.from({ length: 61 }, (_, i) => ({ ...tiny().parts[0], id: "x" + i }));
    expect(validateProject(p).ok).toBe(false);
  });
  it("rejects duplicate part ids and bad colors", () => {
    const p = tiny(); p.parts.push({ ...tiny().parts[0] });
    expect(validateProject(p).ok).toBe(false);
    const q = tiny(); q.parts[0].color = "red; drop";
    expect(validateProject(q).ok).toBe(false);
  });
  it("checks nested children", () => {
    const p = tiny(); p.parts[0].shape = { type: "subtract", children: [{ type: "box", w: 10, d: 10, h: 10 }, { type: "cylinder", d: "hole", h: 20 }] };
    const r = validateProject(p);
    expect(r.ok).toBe(false);
  });
  it("gives a part's param values as numbers", () => {
    expect(paramValues(tiny().parts[0])).toEqual({ length: 140, wall: 3 });
  });
});
