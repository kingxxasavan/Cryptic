"use client";

import { useCart } from "@/components/providers/cart";
import { cartTotals } from "@/lib/cart";
import { useCartProducts } from "@/lib/hooks";
import { Container, Eyebrow } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight, BagIcon } from "@/components/ui/icons";
import { OrderLines, TotalsTable } from "@/components/checkout/summary";

export default function CartPage() {
  const cart = useCart();
  const { items } = useCartProducts(cart.lines);
  const totals = cartTotals(cart.lines, items);

  return (
    <Container className="max-w-5xl pt-14">
      <Eyebrow>Cart</Eyebrow>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em]">Your cart</h1>

      {!cart.ready ? (
        <div className="mt-10 h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
      ) : items.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/5 text-muted">
            <BagIcon width={24} height={24} />
          </span>
          <p className="mt-5 text-lg font-medium">Your cart is empty</p>
          <p className="mt-2 max-w-sm text-muted">Find a Skill, GPT or course that saves you hours this week.</p>
          <ButtonLink href="/explore" className="mt-7">
            Explore the marketplace
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="card px-6 py-2">
            <OrderLines items={items} onRemove={cart.remove} />
          </div>
          <div className="card h-fit p-6">
            <TotalsTable totals={totals} />
            <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
              Checkout <ArrowRight width={16} height={16} />
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-faint">Have a code? Add it on the next step.</p>
          </div>
        </div>
      )}
    </Container>
  );
}
