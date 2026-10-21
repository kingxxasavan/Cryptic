import { CATEGORIES } from "@/lib/catalog";
import type { CategoryId, SearchQuery, SortKey } from "@/lib/types";

export type RawParams = Record<string, string | string[] | undefined>;

export const SORTS: { id: SortKey; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dollarsToCents = (v: string | undefined) => {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

export function parseSearchParams(raw: RawParams): SearchQuery {
  const out: SearchQuery = {};
  const q = first(raw.q)?.trim().slice(0, 100);
  if (q) out.q = q;
  const category = first(raw.category);
  if (CATEGORIES.some((c) => c.id === category)) out.category = category as CategoryId;
  const sort = first(raw.sort);
  out.sort = SORTS.some((s) => s.id === sort) ? (sort as SortKey) : "trending";
  const min = dollarsToCents(first(raw.min));
  const max = dollarsToCents(first(raw.max));
  if (min !== undefined) out.min = min;
  if (max !== undefined) out.max = max;
  return out;
}

export function toSearchString(q: SearchQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("category", q.category);
  if (q.sort && q.sort !== "trending") p.set("sort", q.sort);
  if (q.min !== undefined) p.set("min", String(q.min / 100));
  if (q.max !== undefined) p.set("max", String(q.max / 100));
  return p.toString();
}

/** only allow same site paths after login, so ?next= can't bounce people to another site */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
