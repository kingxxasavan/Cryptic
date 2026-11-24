import { describe, expect, it } from "vitest";
import { applyChanges } from "@/lib/editor/changes";
import { history } from "@/lib/editor/history";
import { tiny } from "./validate.test";

describe("applyChanges", () => {
  it("sets a size within its range", () => {
    const r = applyChanges(tiny(), [{ op: "set_param", part: "arm", name: "length", value: 150 }]);
    if ("error" in r) throw new Error(r.error);
    expect(r.project.parts[0].params.length.value).toBe(150);
  });
  it("widens a size's range when the AI asks past it", () => {
    const r = applyChanges(tiny(), [{ op: "set_param", part: "arm", name: "length", value: 180 }]);
    if ("error" in r) throw new Error(r.error);
    expect(r.project.parts[0].params.length.max).toBeGreaterThanOrEqual(180);
  });
  it("an unknown part fails the whole list and changes nothing", () => {
    const before = tiny();
    const r = applyChanges(before, [{ op: "set_param", part: "arm", name: "length", value: 150 }, { op: "set", part: "ghost", field: "color", value: "#ffffff" }]);
    expect("error" in r && r.error).toMatch(/ghost/);
    expect(before.parts[0].params.length.value).toBe(140);
  });
  it("a change that breaks the recipe is refused", () => {
    const r = applyChanges(tiny(), [{ op: "replace_shape", part: "arm", shape: { type: "box", w: "missing", d: 1, h: 1 } }]);
    expect("error" in r && r.error).toMatch(/missing/);
  });
  it("adds and removes parts, and removing clears links to it", () => {
    const add = applyChanges(tiny(), [{ op: "add_part", part: { ...tiny().parts[0], id: "pad", name: "Nose pad", attachesTo: ["arm"] } }]);
    if ("error" in add) throw new Error(add.error);
    expect(add.project.parts.map(p => p.id)).toEqual(["arm", "pad"]);
    const rm = applyChanges(add.project, [{ op: "remove_part", part: "arm" }]);
    if ("error" in rm) throw new Error(rm.error);
    expect(rm.project.parts.map(p => p.id)).toEqual(["pad"]);
    expect(rm.project.parts[0].attachesTo).toEqual([]);
  });
  it("only known fields can be set", () => {
    const r = applyChanges(tiny(), [{ op: "set", part: "arm", field: "shape", value: {} }]);
    expect("error" in r).toBe(true);
    const ok = applyChanges(tiny(), [{ op: "set", part: "arm", field: "color", value: "#ff0000" }, { op: "set", part: "arm", field: "position", value: [1, 2, 3] }]);
    if ("error" in ok) throw new Error(ok.error);
    expect(ok.project.parts[0].color).toBe("#ff0000");
  });
});

describe("history", () => {
  it("undo and redo walk back and forward exactly", () => {
    const h0 = history(tiny());
    const r = applyChanges(h0.present, [{ op: "set_param", part: "arm", name: "length", value: 150 }]);
    if ("error" in r) throw new Error(r.error);
    const h1 = h0.push(r.project);
    expect(h1.present.parts[0].params.length.value).toBe(150);
    const h2 = h1.undo();
    expect(h2.present).toEqual(tiny());
    expect(h2.redo().present.parts[0].params.length.value).toBe(150);
    expect(h0.canUndo).toBe(false);
    expect(h1.canUndo).toBe(true);
  });
  it("keeps at most 100 steps", () => {
    let h = history(tiny());
    for (let i = 0; i < 130; i++) h = h.push({ ...h.present, name: "v" + i });
    let n = 0; while (h.canUndo) { h = h.undo(); n++; }
    expect(n).toBe(100);
  });
});
