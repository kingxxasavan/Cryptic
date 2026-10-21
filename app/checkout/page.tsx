"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth";
import { useCart } from "@/components/providers/cart";
import { cartTotals, discountRate } from "@/lib/cart";
import { useCartProducts } from "@/lib/hooks";
import { getStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import type { CheckoutResult } from "@/lib/checkout";
import { Container, Eyebrow } from "@/components/ui/bits";
import { Button, ButtonLink } from "@/components/ui/button";
import { LockIcon } from "@/components/ui/icons";
import { OrderLines, TotalsTable } from "@/components/checkout/summary";

const fmtCard = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const LAST_ORDER_KEY = "cryptic:last-order";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const cart = useCart();
  const { items, loading: itemsLoading } = useCartProducts(cart.lines);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const totals = cartTotals(cart.lines, items, applied);
  const free = totals.total === 0;

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/checkout");
  }, [loading, user, router]);

  if (loading || !user || !cart.ready || (itemsLoading && !paying)) {
    return (
      <Container className="max-w-5xl pt-14">
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />
      </Container>
    );
  }

  if (items.length === 0 && !paying) {
    return (
      <Container className="flex min-h-[50vh] max-w-5xl flex-col items-center justify-center text-center">
        <p className="text-lg font-medium">Nothing to check out yet</p>
        <ButtonLink href="/explore" className="mt-6">
          Explore the marketplace
        </ButtonLink>
      </Container>
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setPaying(true);
    try {
      const seeded = items.filter((p) => !p.userMade).map((p) => p.id);
      const community = items.filter((p) => p.userMade).map((p) => ({ id: p.id, priceCents: p.priceCents }));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: seeded, community, email: email || user.email, code: applied, card: free ? undefined : card }),
      });
      const data = (await res.json()) as CheckoutResult;
      if (!data.ok) {
        setError(data.error);
        setPaying(false);
        return;
      }
      await getStore().addPurchases(user.uid, data.productIds, data.orderId);
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderId: data.orderId, productIds: data.productIds, total: data.totals.total }));
      } catch {}
      router.push(`/checkout/success?order=${data.orderId}`);
      cart.removeMany(data.productIds);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setPaying(false);
    }
  }

  return (
    <Container className="max-w-5xl pt-14">
      <Eyebrow>Checkout</Eyebrow>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em]">Almost yours.</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={pay} className="card space-y-6 p-6 sm:p-8" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-muted">
              Email for receipt
            </label>
            <input id="email" type="email" className="input" placeholder={user.email} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          {!free && (
            <fieldset className="space-y-4">
              <legend className="mb-3 flex w-full items-center justify-between text-sm text-muted">
                <span>Card details</span>
                <button type="button" onClick={() => setCard({ number: "4242 4242 4242 4242", exp: "12/30", cvc: "123", name: user.name })} className="rounded-full bg-gold/10 px-2.5 py-1 text-xs text-gold hover:bg-gold/15">
                  Fill test card
                </button>
              </legend>
              <div>
                <label htmlFor="cc-name" className="sr-only">
                  Name on card
                </label>
                <input id="cc-name" className="input" placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} autoComplete="cc-name" />
              </div>
              <div>
                <label htmlFor="cc-number" className="sr-only">
                  Card number
                </label>
                <input
                  id="cc-number"
                  inputMode="numeric"
                  className="input font-mono tracking-wider"
                  placeholder="4242 4242 4242 4242"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                  autoComplete="cc-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cc-exp" className="sr-only">
                    Expiry
                  </label>
                  <input id="cc-exp" inputMode="numeric" className="input font-mono" placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} autoComplete="cc-exp" />
                </div>
                <div>
                  <label htmlFor="cc-cvc" className="sr-only">
                    CVC
                  </label>
                  <input
                    id="cc-cvc"
                    inputMode="numeric"
                    className="input font-mono"
                    placeholder="CVC"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rise rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {error}
            </p>
          )}

          <Button size="lg" className="w-full" disabled={paying}>
            {paying ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" /> Processing
              </>
            ) : free ? (
              "Get it free"
            ) : (
              `Pay ${formatPrice(totals.total)}`
            )}
          </Button>
          <p className="flex items-center justify-center gap-2 text-xs text-faint">
            <LockIcon width={13} height={13} /> Demo checkout. No real payment is taken.
          </p>
        </form>

        <div className="card h-fit p-6">
          <p className="text-sm font-medium">Order summary</p>
          <OrderLines items={items} />
          <form
            className="mb-5 mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (discountRate(code)) setApplied(code);
              else setError("That code isn’t valid.");
            }}
          >
            <label htmlFor="promo" className="sr-only">
              Promo code
            </label>
            <input id="promo" className="input h-10 uppercase" placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button variant="outline" size="sm" className="h-10">
              Apply
            </Button>
          </form>
          <TotalsTable totals={totals} />
        </div>
      </div>
    </Container>
  );
}
