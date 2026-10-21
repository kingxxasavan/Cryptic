"use client";

import { searchProducts } from "@/lib/catalog";
import { useListings } from "@/lib/hooks";
import type { Product, SearchQuery } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";

/** seeded results come from the server, community listings live in firebase or the browser and merge in here */
export function ExploreResults({ query, seeded }: { query: SearchQuery; seeded: Product[] }) {
  const { listings } = useListings();
  const community = searchProducts(listings, query);
  const total = seeded.length + community.length;

  return (
    <>
      <p className="mt-8 text-sm text-faint" aria-live="polite">
        {total} {total === 1 ? "result" : "results"}
        {query.q ? ` for “${query.q}”` : ""}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {community.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {seeded.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {total === 0 && (
        <div className="card mt-2 flex flex-col items-center px-6 py-20 text-center">
          <p className="font-display text-5xl italic text-gold/70">Nothing yet</p>
          <p className="mt-4 max-w-sm text-muted">No listings match that. Try fewer words, a different category, or browse everything.</p>
          <ButtonLink href="/explore" variant="outline" className="mt-7">
            Clear filters
          </ButtonLink>
        </div>
      )}
    </>
  );
}
