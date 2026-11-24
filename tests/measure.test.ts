import { describe, expect, it } from "vitest";
import { weightGrams, densityOf, MATERIALS, sizeOf } from "@/lib/geometry/measure";

describe("measure", () => {
  it("weight from volume and the material's density", () => {
    expect(weightGrams(1000, "PLA")).toBeCloseTo(1.24, 5);       // 1 cm³ of PLA
    expect(weightGrams(1000, "Aluminium")).toBeCloseTo(2.7, 5);
    expect(weightGrams(1000, "aluminum")).toBeCloseTo(2.7, 5);   // either spelling, any case
  });
  it("an unknown material has no weight rather than a made up one", () => {
    expect(densityOf("unobtainium")).toBeNull();
    expect(weightGrams(1000, "unobtainium")).toBeNull();
  });
  it("lists the materials with densities", () => {
    expect(MATERIALS.length).toBeGreaterThan(8);
    expect(MATERIALS.every(m => m.density > 0)).toBe(true);
  });
  it("size is width × depth × height from a box", () => {
    expect(sizeOf({ min: [-5, -10, 0], max: [5, 10, 3.25] })).toEqual([10, 20, 3.25]);
  });
});
