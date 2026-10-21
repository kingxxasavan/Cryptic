import { CATEGORIES } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import type { ListingDraft, Product } from "@/lib/types";

export const randomId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

/** returns an error message, or null when the draft is fine */
export function validateDraft(d: ListingDraft): string | null {
  if (d.title.trim().length < 3 || d.title.length > 80) return "Title needs to be 3 to 80 characters.";
  if (d.tagline.trim().length < 3 || d.tagline.length > 120) return "Tagline needs to be 3 to 120 characters.";
  if (d.description.trim().length < 20) return "Description needs at least 20 characters.";
  if (!CATEGORIES.some((c) => c.id === d.category)) return "Pick a category.";
  if (!Number.isInteger(d.priceCents) || d.priceCents < 0 || d.priceCents > 100000) return "Price must be between $0 and $1,000.";
  return null;
}

export function productFromDraft(uid: string, creatorName: string, d: ListingDraft): Product {
  const id = randomId("u");
  return {
    id,
    slug: `${slugify(d.title) || "listing"}-${id.slice(2, 8)}`,
    title: d.title.trim(),
    tagline: d.tagline.trim(),
    description: d.description.trim(),
    category: d.category,
    priceCents: d.priceCents,
    creatorHandle: `u-${uid.slice(0, 10)}`,
    creatorName,
    rating: 0,
    reviewCount: 0,
    sales: 0,
    tags: d.tags.map((t) => t.trim()).filter(Boolean).slice(0, 6),
    createdAt: new Date().toISOString().slice(0, 10),
    accent: Math.floor(Math.random() * 360),
    contents: [{ title: "Main file", detail: "Delivered after purchase" }],
    preview: d.description.trim(),
    userMade: true,
  };
}
