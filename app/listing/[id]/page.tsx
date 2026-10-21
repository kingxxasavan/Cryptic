"use client";

import { use } from "react";
import { useListings } from "@/lib/hooks";
import { Container } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { ProductDetail } from "@/components/product/detail";

/** community listings live in firebase or this browser, so they render on the client */
export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { listings, loading } = useListings();
  const product = listings.find((l) => l.id === id);

  if (loading) {
    return (
      <Container className="pt-16">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/5" />
        <div className="mt-8 aspect-[16/8] animate-pulse rounded-[26px] bg-white/[0.03]" />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-gold font-display text-7xl italic">Not found</p>
        <p className="mt-4 text-muted">This listing doesn’t exist or was removed by its creator.</p>
        <ButtonLink href="/explore" className="mt-8">
          Back to explore
        </ButtonLink>
      </Container>
    );
  }

  return <ProductDetail product={product} seededReviews={[]} related={[]} />;
}
