import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { validateCheckout, type CheckoutBody } from "@/lib/checkout";

const now = new Date("2026-10-21T00:00:00Z");
const good: CheckoutBody = {
  productIds: ["p001"],
  email: "ada@example.com",
  card: { number: "4242 4242 4242 4242", exp: "12/28", cvc: "123" },
};

const err = (b: unknown) => {
  const r = validateCheckout(b, now);
  return r.ok ? null : r.error;
};

describe("validateCheckout", () => {
  it("accepts the test card with spaces and returns totals and an order id", () => {
    const r = validateCheckout(good, now);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.orderId).toMatch(/^ord_/);
      expect(r.totals.total).toBe(7900);
      expect(r.productIds).toEqual(["p001"]);
    }
  });

  it("applies CRYPTIC10", () => {
    const r = validateCheckout({ ...good, code: "cryptic10" }, now);
    expect(r.ok && r.totals.total).toBe(7110);
  });

  it("rejects an empty cart", () => {
    expect(err({ ...good, productIds: [] })).toBe("Your cart is empty.");
  });

  it("rejects unknown product ids", () => {
    expect(err({ ...good, productIds: ["p001", "ghost"] })).toBe("Some items in your cart are no longer available.");
  });

  it("declines the decline test card", () => {
    expect(err({ ...good, card: { ...good.card, number: "4000 0000 0000 0002" } })).toBe("Card declined.");
  });

  it("rejects other real looking cards in demo mode", () => {
    expect(err({ ...good, card: { ...good.card, number: "5555 5555 5555 4444" } })).toBe("Demo mode: use the test card 4242 4242 4242 4242.");
  });

  it("rejects bad card numbers, expired cards, bad cvc and bad email", () => {
    expect(err({ ...good, card: { ...good.card, number: "1234" } })).toBe("That card number isn’t valid.");
    expect(err({ ...good, card: { ...good.card, exp: "01/24" } })).toBe("That card has expired.");
    expect(err({ ...good, card: { ...good.card, exp: "13/30" } })).toBe("Expiry should look like MM/YY.");
    expect(err({ ...good, card: { ...good.card, cvc: "1" } })).toBe("CVC should be 3 or 4 digits.");
    expect(err({ ...good, email: "nope" })).toBe("Enter a valid email.");
  });

  it("skips the card for a free cart", () => {
    const free = validateCheckout({ productIds: [PRODUCTS.find((p) => p.priceCents === 0)!.id], email: "ada@example.com" }, now);
    expect(free.ok).toBe(true);
  });

  it("accepts well formed community listings with their own price", () => {
    const r = validateCheckout({ ...good, productIds: [], community: [{ id: "u_abc123", priceCents: 1500 }] }, now);
    expect(r.ok && r.totals.total).toBe(1500);
    expect(err({ ...good, productIds: [], community: [{ id: "<script>", priceCents: 1500 }] })).toBe("Some items in your cart are no longer available.");
    expect(err({ ...good, productIds: [], community: [{ id: "u_abc", priceCents: -5 }] })).toBe("Some items in your cart are no longer available.");
  });

  it("survives garbage bodies", () => {
    expect(err(null)).toBe("Invalid request.");
    expect(err("hi")).toBe("Invalid request.");
    expect(err({ productIds: "p001" })).toBe("Invalid request.");
  });
});
