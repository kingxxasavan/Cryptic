import type { Metadata } from "next";
import { PRODUCTS, getCategory, searchProducts } from "@/lib/catalog";
import { parseSearchParams, type RawParams } from "@/lib/query";
import { Container, Eyebrow } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { Filters } from "@/components/explore/filters";
import { UserResults } from "@/components/explore/user-results";
import { ProductCard } from "@/components/ui/product-card";

export async function generateMetadata({ searchParams }: { searchParams: Promise<RawParams> }): Promise<Metadata> {
  const q = parseSearchParams(await searchParams);
  const cat = q.category && getCategory(q.category);
  return { title: cat ? cat.name : "Explore", description: cat ? cat.blurb : "Browse every Claude Skill, GPT, prompt pack and AI course on Cryptic." };
}

export default async function Explore({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseSearchParams(await searchParams);
  const results = searchProducts(PRODUCTS, query);
  const cat = query.category ? getCategory(query.category) : undefined;

  return (
    <Container className="pb-8 pt-14">
      <div className="mb-10">
        <Eyebrow>{cat ? "Category" : "Marketplace"}</Eyebrow>
        <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{cat ? cat.name : "Explore everything"}</h1>
        <p className="mt-3 max-w-xl text-muted">{cat ? cat.blurb : "Every listing on Cryptic, from one prompt to full courses."}</p>
      </div>

      <Filters query={query} />

      <p className="mt-8 text-sm text-faint" aria-live="polite">
        {results.length} {results.length === 1 ? "result" : "results"}
        {query.q ? ` for “${query.q}”` : ""}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <UserResults query={query} />
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {results.length === 0 && (
        <div className="card mt-2 flex flex-col items-center px-6 py-20 text-center">
          <p className="font-display text-5xl italic text-gold/70">Nothing yet</p>
          <p className="mt-4 max-w-sm text-muted">No listings match that. Try fewer words, a different category, or browse everything.</p>
          <ButtonLink href="/explore" variant="outline" className="mt-7">
            Clear filters
          </ButtonLink>
        </div>
      )}
    </Container>
  );
}
