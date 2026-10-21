import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CREATORS, getCreator, productsByCreator } from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { Avatar, Container, Eyebrow, Verified } from "@/components/ui/bits";
import { ProductCard } from "@/components/ui/product-card";

export const dynamicParams = false;

export function generateStaticParams() {
  return CREATORS.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const c = getCreator((await params).handle);
  return c ? { title: c.name, description: c.bio } : {};
}

export default async function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const creator = getCreator((await params).handle);
  if (!creator) notFound();
  const items = productsByCreator(creator.handle).sort((a, b) => b.sales - a.sales);
  const sales = items.reduce((s, p) => s + p.sales, 0);
  const rating = items.reduce((s, p) => s + p.rating, 0) / (items.length || 1);

  return (
    <>
      <div className="relative isolate overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: `radial-gradient(60% 120% at 20% 0%, hsl(${creator.avatarHue} 60% 40% / 0.5), transparent 70%)` }}
          aria-hidden
        />
        <Container className="flex flex-col gap-8 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-6">
            <Avatar name={creator.name} hue={creator.avatarHue} size={96} className="ring-4 ring-ink" />
            <div>
              <Eyebrow>Creator</Eyebrow>
              <h1 className="mt-2 flex items-center gap-2.5 text-4xl font-semibold tracking-[-0.03em]">
                {creator.name} {creator.verified && <Verified />}
              </h1>
              <p className="mt-2 max-w-lg text-muted">{creator.bio}</p>
            </div>
          </div>
          <dl className="flex gap-10">
            {[
              [formatCount(creator.followers), "Followers"],
              [formatCount(sales), "Sales"],
              [rating.toFixed(1), "Avg rating"],
            ].map(([v, l]) => (
              <div key={l}>
                <dd className="text-gold font-display text-4xl">{v}</dd>
                <dt className="text-sm text-faint">{l}</dt>
              </div>
            ))}
          </dl>
        </Container>
      </div>
      <Container className="pt-12">
        <h2 className="text-xl font-semibold">
          {items.length} {items.length === 1 ? "listing" : "listings"}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
