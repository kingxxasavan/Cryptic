import type { CartLine, CartTotals, Product } from "@/lib/types";

const CODES: Record<string, number> = { CRYPTIC10: 0.1 };

export const addLine = (lines: CartLine[], productId: string): CartLine[] =>
  lines.some((l) => l.productId === productId) ? lines : [...lines, { productId }];

export const removeLine = (lines: CartLine[], productId: string): CartLine[] =>
  lines.filter((l) => l.productId !== productId);

export const discountRate = (code?: string) => CODES[code?.trim().toUpperCase() ?? ""] ?? 0;

export function cartTotals(lines: CartLine[], products: Product[], code?: string): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + (products.find((p) => p.id === l.productId)?.priceCents ?? 0), 0);
  const discount = Math.round(subtotal * discountRate(code));
  const fee = 0;
  return { subtotal, discount, fee, total: subtotal - discount + fee };
}
