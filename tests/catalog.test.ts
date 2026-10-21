import { describe, expect, it } from "vitest";
import { CATEGORIES, PRODUCTS, CREATORS, getCreator, getProduct, searchProducts } from "@/lib/catalog";

describe("seed data", () => {
  it("has 40 products covering all 6 categories", () => {
    expect(PRODUCTS).toHaveLength(40);
    const used = new Set(PRODUCTS.map((p) => p.category));
    for (const c of CATEGORIES) expect(used.has(c.id)).toBe(true);
    expect(CATEGORIES.map((c) => c.id)).toEqual([
      "claude-skills",
      "gpts",
      "prompt-packs",
      "courses",
      "context-engineering",
      "agents-mcp",
    ]);
  });

  it("has 10 creators and every product points at a real one", () => {
    expect(CREATORS).toHaveLength(10);
    for (const p of PRODUCTS) expect(getCreator(p.creatorHandle)).toBeDefined();
  });

  it("has unique slugs and integer cent prices", () => {
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length);
    for (const p of PRODUCTS) expect(Number.isInteger(p.priceCents)).toBe(true);
  });
});

describe("lookups", () => {
  it("returns undefined for unknown slug and handle", () => {
    expect(getProduct("nope-not-real")).toBeUndefined();
    expect(getCreator("ghost")).toBeUndefined();
  });

  it("finds a product by slug", () => {
    const first = PRODUCTS[0];
    expect(getProduct(first.slug)?.id).toBe(first.id);
  });
});

describe("searchProducts", () => {
  const sample = PRODUCTS;

  it("matches title case insensitively", () => {
    const target = sample[3];
    const word = target.title.split(" ")[0].toUpperCase();
    const res = searchProducts(sample, { q: word });
    expect(res.some((p) => p.id === target.id)).toBe(true);
  });

  it("matches tags", () => {
    const target = sample[5];
    const res = searchProducts(sample, { q: target.tags[0] });
    expect(res.some((p) => p.id === target.id)).toBe(true);
  });

  it("treats whitespace query as no query", () => {
    expect(searchProducts(sample, { q: "   " })).toHaveLength(sample.length);
  });

  it("does not throw on odd input and returns empty for no match", () => {
    expect(() => searchProducts(sample, { q: "%" })).not.toThrow();
    expect(() => searchProducts(sample, { q: "(.*[" })).not.toThrow();
    expect(searchProducts(sample, { q: "zzzqqqxx🦄" })).toEqual([]);
  });

  it("filters by category", () => {
    const res = searchProducts(sample, { category: "courses" });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => p.category === "courses")).toBe(true);
  });

  it("filters by price range in cents inclusive", () => {
    const res = searchProducts(sample, { min: 1000, max: 3000 });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => p.priceCents >= 1000 && p.priceCents <= 3000)).toBe(true);
  });

  it("sorts by price ascending and descending", () => {
    const asc = searchProducts(sample, { sort: "price-asc" }).map((p) => p.priceCents);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = searchProducts(sample, { sort: "price-desc" }).map((p) => p.priceCents);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("sorts by rating, newest and trending", () => {
    const rating = searchProducts(sample, { sort: "rating" }).map((p) => p.rating);
    expect(rating).toEqual([...rating].sort((a, b) => b - a));
    const newest = searchProducts(sample, { sort: "newest" }).map((p) => p.createdAt);
    expect(newest).toEqual([...newest].sort((a, b) => b.localeCompare(a)));
    const trending = searchProducts(sample, { sort: "trending" }).map((p) => p.sales);
    expect(trending).toEqual([...trending].sort((a, b) => b - a));
  });

  it("does not mutate the input array", () => {
    const copy = [...sample];
    searchProducts(sample, { sort: "price-asc" });
    expect(sample).toEqual(copy);
  });
});
