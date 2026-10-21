"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart";
import { useLibrary } from "@/lib/hooks";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { ArrowRight, CheckIcon } from "@/components/ui/icons";

export function BuyBox({ product }: { product: Product }) {
  const cart = useCart();
  const lib = useLibrary();
  const router = useRouter();
  const owned = lib.owns(product.id);
  const inCart = cart.has(product.id);

  const add = () => {
    cart.add(product.id);
    toast.success("Added to cart", {
      description: product.title,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-4xl font-semibold tracking-[-0.03em] tabular-nums">{formatPrice(product.priceCents)}</p>
        {product.priceCents > 0 && <p className="text-xs text-faint">One time · USD</p>}
      </div>

      <div className="mt-6 space-y-2.5">
        {owned ? (
          <ButtonLink href={`/dashboard?open=${product.id}`} className="w-full" size="lg">
            Open in library <ArrowRight width={16} height={16} />
          </ButtonLink>
        ) : (
          <>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                cart.add(product.id);
                router.push("/checkout");
              }}
            >
              {product.priceCents === 0 ? "Get it free" : "Buy now"}
            </Button>
            {inCart ? (
              <ButtonLink href="/cart" variant="outline" size="lg" className="w-full">
                In your cart · View
              </ButtonLink>
            ) : (
              <Button variant="outline" size="lg" className="w-full" onClick={add}>
                Add to cart
              </Button>
            )}
          </>
        )}
      </div>

      <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-muted">
        {["Instant access in your library", "Free updates forever", "14 day no questions refund", "Commercial use license"].map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <CheckIcon width={16} height={16} className="text-gold" />
            {t}
          </li>
        ))}
      </ul>
      {product.priceCents > 0 && !owned && (
        <p className="mt-5 rounded-xl bg-gold/[0.07] px-3.5 py-2.5 text-xs text-gold/90">
          Use code <span className="font-mono font-semibold">CRYPTIC10</span> at checkout for 10% off.
        </p>
      )}
    </div>
  );
}
