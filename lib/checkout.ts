import { cartTotals } from "@/lib/cart";
import { getProductById } from "@/lib/catalog";
import type { CartTotals, Product } from "@/lib/types";

export const TEST_CARD = "4242424242424242";
const DECLINE_CARD = "4000000000000002";

export interface CheckoutBody {
  productIds: string[];
  /** user made listings, the server can't see them so the client sends their price */
  community?: { id: string; priceCents: number }[];
  email: string;
  code?: string;
  card?: { number: string; exp: string; cvc: string };
}

export type CheckoutResult =
  | { ok: true; orderId: string; totals: CartTotals; productIds: string[] }
  | { ok: false; error: string };

const fail = (error: string): CheckoutResult => ({ ok: false, error });

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const isStr = (v: unknown): v is string => typeof v === "string";

export function validateCheckout(input: unknown, now = new Date()): CheckoutResult {
  if (!input || typeof input !== "object") return fail("Invalid request.");
  const b = input as Partial<CheckoutBody>;
  if (!Array.isArray(b.productIds) || !b.productIds.every(isStr)) return fail("Invalid request.");
  if (b.community !== undefined && !Array.isArray(b.community)) return fail("Invalid request.");

  const community = b.community ?? [];
  if (b.productIds.length + community.length === 0) return fail("Your cart is empty.");

  const seeded = b.productIds.map(getProductById);
  const communityOk = community.every(
    (c) => isStr(c?.id) && /^u_[a-z0-9]{4,24}$/.test(c.id) && Number.isInteger(c.priceCents) && c.priceCents >= 0 && c.priceCents <= 100000,
  );
  if (seeded.some((p) => !p) || !communityOk) return fail("Some items in your cart are no longer available.");

  const products = [...(seeded as Product[]), ...community.map((c) => ({ id: c.id, priceCents: c.priceCents }) as Product)];
  const ids = [...new Set(products.map((p) => p.id))];
  const totals = cartTotals(
    ids.map((productId) => ({ productId })),
    products,
    isStr(b.code) ? b.code : undefined,
  );

  if (!isStr(b.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) return fail("Enter a valid email.");

  if (totals.total > 0) {
    const card = b.card;
    if (!card || !isStr(card.number) || !isStr(card.exp) || !isStr(card.cvc)) return fail("Enter your card details.");
    const digits = card.number.replace(/[\s-]/g, "");
    if (!/^\d{12,19}$/.test(digits) || !luhn(digits)) return fail("That card number isn’t valid.");
    const m = card.exp.trim().match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
    if (!m) return fail("Expiry should look like MM/YY.");
    const endOfMonth = new Date(Date.UTC(2000 + Number(m[2]), Number(m[1]), 1));
    if (endOfMonth <= now) return fail("That card has expired.");
    if (!/^\d{3,4}$/.test(card.cvc.trim())) return fail("CVC should be 3 or 4 digits.");
    if (digits === DECLINE_CARD) return fail("Card declined.");
    if (digits !== TEST_CARD) return fail("Demo mode: use the test card 4242 4242 4242 4242.");
  }

  const orderId = `ord_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return { ok: true, orderId, totals, productIds: ids };
}
