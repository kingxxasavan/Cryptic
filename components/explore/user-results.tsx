"use client";

import { searchProducts } from "@/lib/catalog";
import { useListings } from "@/lib/hooks";
import type { SearchQuery } from "@/lib/types";
import { ProductCard } from "@/components/ui/product-card";

/** user made listings live in firebase or the browser, so they're merged in on the client */
export function UserResults({ query }: { query: SearchQuery }) {
  const { listings } = useListings();
  const matches = searchProducts(listings, query);
  if (!matches.length) return null;
  return (
    <>
      {matches.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </>
  );
}
