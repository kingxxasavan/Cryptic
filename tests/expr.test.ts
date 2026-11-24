import { describe, expect, it } from "vitest";
import { evalExpr, ExprError, namesIn } from "@/lib/recipe/expr";

describe("evalExpr", () => {
  const p = { arm_length: 140, wall: 2, a: 3, b: 7 };
  it("numbers pass straight through", () => {
    expect(evalExpr(12.5, p)).toBe(12.5);
    expect(evalExpr("12.5", p)).toBe(12.5);
  });
  it("uses params with the usual precedence", () => {
    expect(evalExpr("arm_length - 2 * wall", p)).toBe(136);
    expect(evalExpr("(a + b) / 2", p)).toBe(5);
    expect(evalExpr("-wall + 10", p)).toBe(8);
  });
  it("has min and max", () => {
    expect(evalExpr("min(a, b)", p)).toBe(3);
    expect(evalExpr("max(a, b, 9)", p)).toBe(9);
  });
  it("refuses unknown names and anything that isn't arithmetic", () => {
    expect(() => evalExpr("nope + 1", p)).toThrow(ExprError);
    expect(() => evalExpr("process.exit()", p)).toThrow(ExprError);
    expect(() => evalExpr("a; b", p)).toThrow(ExprError);
    expect(() => evalExpr("1 / 0", p)).toThrow(ExprError);
  });
  it("lists the names an expression uses", () => {
    expect(namesIn("arm_length - 2 * wall + min(a, 3)")).toEqual(["arm_length", "wall", "a"]);
    expect(namesIn(4)).toEqual([]);
  });
});
