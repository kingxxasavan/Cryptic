import { CREATORS } from "@/lib/data/creators";
import { PRODUCTS } from "@/lib/data/products";
import type { Category, Product, SearchQuery } from "@/lib/types";

export { CREATORS, PRODUCTS };

export const CATEGORIES: Category[] = [
  { id: "claude-skills", name: "Claude Skills", blurb: "Packaged expertise Claude loads on demand.", glyph: "✳" },
  { id: "gpts", name: "GPTs", blurb: "Custom ChatGPT assistants, ready to publish.", glyph: "◎" },
  { id: "prompt-packs", name: "Prompt Packs", blurb: "Battle tested prompts for every job.", glyph: "❖" },
  { id: "courses", name: "Courses", blurb: "Learn AI usage and prompting properly.", glyph: "▲" },
  { id: "context-engineering", name: "Context Engineering", blurb: "Retrieval, memory and long context craft.", glyph: "◈" },
  { id: "agents-mcp", name: "Agents & MCP", blurb: "MCP servers, agent blueprints and workflows.", glyph: "⬡" },
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const getCreator = (handle: string) => CREATORS.find((c) => c.handle === handle);
export const productsByCreator = (handle: string) => PRODUCTS.filter((p) => p.creatorHandle === handle);

export function searchProducts(products: Product[], query: SearchQuery): Product[] {
  const q = query.q?.trim().toLowerCase() ?? "";
  const res = products.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.min !== undefined && p.priceCents < query.min) return false;
    if (query.max !== undefined && p.priceCents > query.max) return false;
    if (!q) return true;
    const hay = [p.title, p.tagline, p.description, ...p.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });

  switch (query.sort) {
    case "newest":
      return res.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return res.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return res.sort((a, b) => b.priceCents - a.priceCents);
    case "rating":
      return res.sort((a, b) => b.rating - a.rating);
    case "trending":
      return res.sort((a, b) => b.sales - a.sales);
    default:
      return res;
  }
}
