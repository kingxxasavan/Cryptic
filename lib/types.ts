export type CategoryId =
  | "claude-skills"
  | "gpts"
  | "prompt-packs"
  | "courses"
  | "context-engineering"
  | "agents-mcp";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  glyph: string;
}

export interface ContentItem {
  title: string;
  detail: string;
  minutes?: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  priceCents: number;
  creatorHandle: string;
  rating: number;
  reviewCount: number;
  sales: number;
  tags: string[];
  createdAt: string;
  featured?: boolean;
  /** hue 0 to 360 used for the cover art gradient */
  accent: number;
  contents: ContentItem[];
  preview: string;
  /** true when made by a user through the creator dashboard */
  userMade?: boolean;
  /** display name for user made listings that have no seeded creator */
  creatorName?: string;
}

export interface Creator {
  handle: string;
  name: string;
  bio: string;
  avatarHue: number;
  verified: boolean;
  followers: number;
}

export type SortKey = "trending" | "newest" | "price-asc" | "price-desc" | "rating";

export interface SearchQuery {
  q?: string;
  category?: CategoryId;
  min?: number;
  max?: number;
  sort?: SortKey;
}

export interface CartLine {
  productId: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
}

export interface User {
  uid: string;
  name: string;
  email: string;
}

export interface Purchase {
  productId: string;
  orderId: string;
  purchasedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface ListingDraft {
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  priceCents: number;
  tags: string[];
}
