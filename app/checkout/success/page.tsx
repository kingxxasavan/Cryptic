"use client";

import { useSyncExternalStore } from "react";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Container } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";

type LastOrder = { orderId: string; productIds: string[]; total: number };

const noop = () => () => {};
let cached: { raw: string | null; value: LastOrder | null } = { raw: null, value: null };
function readOrder(): LastOrder | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem("cryptic:last-order");
  } catch {}
  if (raw !== cached.raw) {
    try {
      cached = { raw, value: raw ? (JSON.parse(raw) as LastOrder) : null };
    } catch {
      cached = { raw, value: null };
    }
  }
  return cached.value;
}

export default function SuccessPage() {
  const order = useSyncExternalStore(noop, readOrder, () => null);
  const names = order?.productIds.map((id) => getProductById(id)?.title ?? "Community listing") ?? [];

  return (
    <Container className="flex min-h-[70vh] max-w-2xl flex-col items-center justify-center py-20 text-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="text-gold" aria-hidden>
        <circle cx="44" cy="44" r="40" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
        <circle cx="44" cy="44" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="252" strokeDashoffset="252" strokeLinecap="round" className="[animation:draw_900ms_var(--ease-out)_forwards]" transform="rotate(-90 44 44)" />
        <path d="M28 45l11 11 22-24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="50" className="[animation:draw_500ms_500ms_var(--ease-out)_forwards]" />
      </svg>
      <h1 className="text-gradient mt-8 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">You&apos;re all set.</h1>
      <p className="mt-4 text-lg text-muted">
        {names.length ? (
          <>
            {names.length === 1 ? names[0] : `${names.length} items`} {names.length === 1 ? "is" : "are"} now in your library.
          </>
        ) : (
          "Your purchase is in your library."
        )}
      </p>
      {order && (
        <p className="mt-2 font-mono text-xs text-faint">
          Order {order.orderId} · {order.total ? formatPrice(order.total) : "Free"}
        </p>
      )}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/dashboard" size="lg">
          Go to library <ArrowRight width={16} height={16} />
        </ButtonLink>
        <ButtonLink href="/explore" variant="outline" size="lg">
          Keep exploring
        </ButtonLink>
      </div>
    </Container>
  );
}
