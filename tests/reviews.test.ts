import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { seededReviews } from "@/lib/reviews";

describe("seededReviews", () => {
  it("gives every product valid dates and ratings", () => {
    for (const p of PRODUCTS) {
      for (const r of seededReviews(p)) {
        expect(Number.isNaN(new Date(r.createdAt).getTime()), `${p.id} ${r.createdAt}`).toBe(false);
        expect(r.rating).toBeGreaterThanOrEqual(1);
        expect(r.rating).toBeLessThanOrEqual(5);
      }
    }
  });

  it("is deterministic", () => {
    expect(seededReviews(PRODUCTS[0])).toEqual(seededReviews(PRODUCTS[0]));
  });
});
