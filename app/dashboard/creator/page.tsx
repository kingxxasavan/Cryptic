"use client";

import { useAuth } from "@/components/providers/auth";
import { useListings } from "@/lib/hooks";
import { formatCount, formatPrice } from "@/lib/format";
import { Eyebrow } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/ui/product-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";

// sample traffic so a fresh studio isn't an empty chart. seeded from the user id so it's stable
function sampleViews(seed: string, listings: number) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: 12 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 40 + i * 18 * (1 + listings * 0.6);
    return Math.round(base + (h % 60));
  });
}

export default function CreatorStudio() {
  const { user } = useAuth();
  const { listings, loading } = useListings();
  const mine = listings.filter((l) => user && l.creatorHandle === `u-${user.uid.slice(0, 10)}`);
  const views = sampleViews(user?.uid ?? "x", mine.length);
  const listValue = mine.reduce((s, p) => s + p.priceCents, 0);

  const stats = [
    ["Listings", String(mine.length)],
    ["Sales", "0"],
    ["Revenue", "$0"],
    ["Views (sample)", formatCount(views.reduce((a, b) => a + b, 0))],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Creator studio</Eyebrow>
          <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em]">Your storefront</h1>
          <p className="mt-2 text-muted">You keep 90% of every sale. Payouts go out weekly once you connect payments.</p>
        </div>
        <ButtonLink href="/dashboard/creator/new">
          <PlusIcon width={16} height={16} /> New listing
        </ButtonLink>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card p-5">
            <dt className="text-sm text-muted">{l}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <WeeklyChart title="Listing views (sample data)" values={views} format={(n) => formatCount(Math.round(n))} />
        <div className="card flex flex-col p-6">
          <p className="text-sm font-medium">Get your first sale</p>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            {[
              [mine.length > 0, "Publish your first listing"],
              [mine.some((m) => m.tags.length >= 3), "Add 3+ tags so buyers find it"],
              [mine.some((m) => m.description.length > 120), "Write a 120+ character description"],
              [false, "Share your listing link"],
            ].map(([ok, t]) => (
              <li key={String(t)} className="flex items-center gap-3">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${ok ? "bg-gold text-ink" : "border border-line"}`}>{ok ? "✓" : ""}</span>
                {t}
              </li>
            ))}
          </ol>
          {mine.length > 0 && <p className="mt-auto pt-6 text-xs text-faint">Total list value: {formatPrice(listValue)}</p>}
        </div>
      </div>

      <h2 className="mt-14 text-xl font-semibold">Your listings</h2>
      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
      ) : mine.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <p className="text-muted">No listings yet. Your first one takes about two minutes.</p>
          <ButtonLink href="/dashboard/creator/new" className="mt-6">
            Create a listing
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
