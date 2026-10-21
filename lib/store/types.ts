import type { ListingDraft, Product, Purchase, Review, User } from "@/lib/types";

export type StoreMode = "firebase" | "local";

export interface ReviewInput {
  author: string;
  rating: number;
  body: string;
}

export interface DataStore {
  name: StoreMode;
  getUser(): Promise<User | null>;
  /** calls back right away with the current user, then on every change. returns unsubscribe */
  onUser(cb: (user: User | null) => void): () => void;
  signUp(name: string, email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getLibrary(uid: string): Promise<Purchase[]>;
  addPurchases(uid: string, productIds: string[], orderId: string): Promise<void>;
  getListings(): Promise<Product[]>;
  createListing(uid: string, draft: ListingDraft): Promise<Product>;
  getReviews(productId: string): Promise<Review[]>;
  addReview(productId: string, review: ReviewInput): Promise<Review>;
}

export interface HybridStore extends DataStore {
  mode(): StoreMode;
  /** calls back right away with the current mode, then when it falls back. returns unsubscribe */
  onMode(cb: (mode: StoreMode) => void): () => void;
}
