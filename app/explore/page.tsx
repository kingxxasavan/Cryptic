import type { Metadata } from "next";
import { PRODUCTS, getCategory, searchProducts } from "@/lib/catalog";
import { parseSearchParams, type RawParams } from "@/lib/query";
import { Container, Eyebrow } from "@/components/ui/bits";
import { Filters } from "@/components/explore/filters";
import { ExploreResults } from "@/components/explore/user-results";

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

      <ExploreResults query={query} seeded={results} />
    </Container>
  );
}
