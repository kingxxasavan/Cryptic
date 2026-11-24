import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/ai/json";
import { designMessages, editMessages, finishProject, clipBrief } from "@/lib/ai/prompts";
import { tiny } from "./validate.test";

describe("extractJson", () => {
  it("finds the object inside prose and code fences", () => {
    expect(extractJson('Sure! ```json\n{"a": 1, "b": [2, 3]}\n``` hope that helps')).toEqual({ a: 1, b: [2, 3] });
    expect(extractJson('<think>hmm {not json}</think>{"ok": true}')).toEqual({ ok: true });
  });
  it("forgives trailing commas and comments", () => {
    expect(extractJson('{"a": [1, 2,], // two\n "b": 3,}')).toEqual({ a: [1, 2], b: 3 });
  });
  it("keeps braces inside strings", () => {
    expect(extractJson('{"note": "a } inside", "n": 1}')).toEqual({ note: "a } inside", n: 1 });
  });
  it("returns null when there's no JSON", () => {
    expect(extractJson("no json here")).toBeNull();
  });
});

describe("prompts", () => {
  const facts = [{ id: "f1", text: "Temple length is usually 135 to 150 mm", url: "https://example.com/a", title: "A" }];
  it("the design prompt carries the brief, the facts by id, and the rules", () => {
    const m = designMessages({ description: "smart glasses", brief: "We talked about a camera in the bridge.", facts });
    const all = m.map(x => x.content).join("\n");
    expect(all).toContain("camera in the bridge");
    expect(all).toContain("[f1]");
    expect(all).toMatch(/millimet/i);
    expect(all).toContain('"subtract"');
  });
  it("says so when research found nothing", () => {
    const all = designMessages({ description: "x", brief: "", facts: [] }).map(m => m.content).join("\n");
    expect(all).toMatch(/no research/i);
  });
  it("the edit prompt carries the selected part and the request", () => {
    const m = editMessages({ project: tiny(), selected: "arm", request: "make it 5mm longer" });
    const all = m.map(x => x.content).join("\n");
    expect(all).toContain('"arm"');
    expect(all).toContain("make it 5mm longer");
    expect(all).toContain("set_param");
  });
  it("clips a very long brief, keeping its start and end", () => {
    const b = "START " + "x".repeat(50000) + " END";
    const c = clipBrief(b, 1000);
    expect(c.length).toBeLessThan(1100);
    expect(c.startsWith("START")).toBe(true);
    expect(c.endsWith("END")).toBe(true);
  });
  it("finishProject fills ids, defaults and marks unknown fact links as estimated", () => {
    const raw = { name: "Glasses", parts: [{ name: "Lens", material: "Polycarbonate", color: "#99ccff", shape: { type: "cylinder", d: "dia", h: 2 },
      params: { dia: { value: 50, min: 40, max: 60, unit: "mm", source: "researched", factId: "f9" } } }] };
    const p = finishProject(raw, { description: "glasses", brief: "", facts, id: "abc" });
    expect(p.id).toBe("abc");
    expect(p.parts[0].id).toBe("lens");
    expect(p.parts[0].params.dia.source).toBe("estimated");
    expect(p.parts[0].finish).toBe("matte");
    expect(p.research).toEqual(facts);
  });
});
