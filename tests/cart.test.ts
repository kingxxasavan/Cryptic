import { describe, expect, it } from "vitest";
import { addLine, cartTotals, linesAfterOrder, removeLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const make = (id: string, priceCents: number) => ({ id, priceCents }) as Product;
const products = [make("a", 4900), make("b", 1999)];

describe("addLine / removeLine", () => {
  it("adding the same product twice keeps one line", () => {
    const lines = addLine(addLine([], "a"), "a");
    expect(lines).toEqual([{ productId: "a" }]);
  });

  it("removing a missing id is a no op", () => {
    const lines = [{ productId: "a" }];
    expect(removeLine(lines, "zzz")).toEqual(lines);
  });

  it("removes an existing id", () => {
    expect(removeLine([{ productId: "a" }, { productId: "b" }], "a")).toEqual([{ productId: "b" }]);
  });
});

describe("cartTotals", () => {
  it("sums subtotal with no code", () => {
    expect(cartTotals([{ productId: "a" }, { productId: "b" }], products)).toEqual({
      subtotal: 6899,
      discount: 0,
      fee: 0,
      total: 6899,
    });
  });

  it("CRYPTIC10 takes 10 percent off", () => {
    expect(cartTotals([{ productId: "a" }], products, "CRYPTIC10")).toEqual({
      subtotal: 4900,
      discount: 490,
      fee: 0,
      total: 4410,
    });
  });

  it("code is case insensitive and trimmed, unknown codes do nothing", () => {
    expect(cartTotals([{ productId: "a" }], products, " cryptic10 ").discount).toBe(490);
    expect(cartTotals([{ productId: "a" }], products, "FREE").discount).toBe(0);
  });

  it("rounds discount to whole cents", () => {
    expect(cartTotals([{ productId: "b" }], products, "CRYPTIC10").discount).toBe(200);
  });

  it("ignores unknown product ids", () => {
    expect(cartTotals([{ productId: "ghost" }, { productId: "b" }], products).subtotal).toBe(1999);
  });
});

describe("formatPrice", () => {
  it("formats cents as dollars", () => {
    expect(formatPrice(4900)).toBe("$49");
    expect(formatPrice(1999)).toBe("$19.99");
    expect(formatPrice(0)).toBe("Free");
  });
});

describe("linesAfterOrder", () => {
  it("removes only what was paid for", () => {
    expect(linesAfterOrder([{ productId: "a" }, { productId: "u_x1y2" }], ["a"])).toEqual([{ productId: "u_x1y2" }]);
  });
});
