import { beforeAll, describe, expect, it } from "vitest";
import Module from "manifold-3d/manifold";
import { buildPart, type Wasm } from "@/lib/geometry/build";
import { sampleGlasses } from "@/lib/sample";
import { validateProject } from "@/lib/recipe/validate";
import { normalizeProject } from "@/lib/recipe/normalize";

let wasm: Wasm;
beforeAll(async () => { wasm = await Module(); wasm.setup(); });

describe("the sample glasses", () => {
  it("is a valid project with several parts", () => {
    const r = validateProject(sampleGlasses("demo"));
    expect(r.ok ? "" : r.errors.join("\n")).toBe("");
    expect(sampleGlasses("demo").parts.length).toBeGreaterThanOrEqual(8);
  });
  it("every part builds into a solid", () => {
    for (const p of sampleGlasses("demo").parts) {
      const r = buildPart(wasm, p);
      expect("error" in r ? `${p.name}: ${r.error}` : "").toBe("");
    }
  });
});

describe("normalizeProject", () => {
  it("puts back what the database drops: empty lists and objects", () => {
    const stored = JSON.parse(JSON.stringify(sampleGlasses("demo")));
    delete stored.research; delete stored.parts[0].attachesTo; delete stored.parts[1].params;
    const p = normalizeProject(stored);
    expect(p.research).toEqual([]);
    expect(p.parts[0].attachesTo).toEqual([]);
    expect(p.parts[1].params).toEqual({});
  });
  it("turns numbered objects back into lists", () => {
    const stored = JSON.parse(JSON.stringify(sampleGlasses("demo")));
    stored.parts = Object.fromEntries(stored.parts.map((p: unknown, i: number) => [String(i), p]));
    expect(Array.isArray(normalizeProject(stored).parts)).toBe(true);
  });
});
