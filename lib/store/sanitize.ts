import { CATEGORIES } from "@/lib/catalog";
import type { ContentItem, Product, Review } from "@/lib/types";

// anything read back from the shared database is untrusted, so rebuild it field by field

type Raw = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : isObj(v) ? Object.values(v) : []);

export function sanitizeListing(key: string, raw: unknown): Product | null {
  if (!isObj(raw) || raw.id !== key || !/^u_[a-z0-9]{4,24}$/.test(key)) return null;
  const title = str(raw.title, 80);
  const tagline = str(raw.tagline, 120);
  const description = str(raw.description, 5000);
  const slug = str(raw.slug, 140);
  const createdAt = str(raw.createdAt, 30);
  const handle = str(raw.creatorHandle, 12);
  const category = CATEGORIES.find((c) => c.id === raw.category)?.id;
  const price = raw.priceCents;
  if (!title || !tagline || description === null || !slug || !createdAt || !category) return null;
  if (!handle || !/^u-[A-Za-z0-9]{1,10}$/.test(handle)) return null;
  if (typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > 100000) return null;

  const contents = list(raw.contents)
    .filter(isObj)
    .map((c): ContentItem | null => {
      const t = str(c.title, 80);
      const d = str(c.detail, 200);
      return t && d !== null ? { title: t, detail: d } : null;
    })
    .filter((c): c is ContentItem => c !== null);
  const accent = typeof raw.accent === "number" && Number.isFinite(raw.accent) ? Math.abs(Math.round(raw.accent)) % 360 : 0;

  return {
    id: key,
    slug,
    title,
    tagline,
    description,
    category,
    priceCents: price,
    creatorHandle: handle,
    creatorName: str(raw.creatorName, 60) ?? "Creator",
    rating: 0,
    reviewCount: 0,
    sales: 0,
    tags: list(raw.tags)
      .map((t) => str(t, 40))
      .filter((t): t is string => !!t)
      .slice(0, 6),
    createdAt,
    accent,
    contents: contents.length ? contents : [{ title: "Main file", detail: "Delivered after purchase" }],
    preview: str(raw.preview, 5000) ?? description,
    userMade: true,
  };
}

export function sanitizeReview(key: string, productId: string, raw: unknown): Review | null {
  if (!isObj(raw) || raw.id !== key || raw.productId !== productId) return null;
  const author = str(raw.author, 60);
  const body = str(raw.body, 2000);
  const createdAt = str(raw.createdAt, 30);
  const rating = raw.rating;
  if (!author || body === null || !createdAt) return null;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return { id: key, productId, author, rating, body, createdAt };
}
