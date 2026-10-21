import { productFromDraft, randomId, validateDraft } from "@/lib/store/listing";
import type { DataStore } from "@/lib/store/types";
import type { Product, Purchase, Review, User } from "@/lib/types";

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type StoredUser = User & { hash: string };

export function memoryStorage(): KV {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

/** localStorage when it works, memory when it doesn't (private mode, SSR) */
export function browserStorage(): KV {
  try {
    const t = "__cryptic_probe";
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

// demo only: passwords are hashed so they don't sit in localStorage as plain text
async function hash(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`cryptic:${pw}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const K = {
  users: "cryptic:users",
  session: "cryptic:session",
  library: (uid: string) => `cryptic:library:${uid}`,
  listings: "cryptic:listings",
  reviews: (pid: string) => `cryptic:reviews:${pid}`,
};

export function hasLocalSession(storage: KV) {
  return storage.getItem(K.session) !== null;
}

export function createLocalStore(storage: KV): DataStore {
  const read = <T,>(key: string, fallback: T): T => {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key: string, value: unknown) => storage.setItem(key, JSON.stringify(value));

  const listeners = new Set<(u: User | null) => void>();
  const current = (): User | null => read<User | null>(K.session, null);
  const emit = () => listeners.forEach((cb) => cb(current()));
  const strip = (s: StoredUser): User => ({ uid: s.uid, name: s.name, email: s.email });

  return {
    name: "local",
    getUser: async () => current(),
    onUser(cb) {
      listeners.add(cb);
      cb(current());
      return () => listeners.delete(cb);
    },
    async signUp(name, email, password) {
      const e = email.trim().toLowerCase();
      const users = read<Record<string, StoredUser>>(K.users, {});
      if (users[e]) throw new Error("That email already has an account. Try logging in.");
      const user: StoredUser = { uid: randomId("local"), name: name.trim() || e.split("@")[0], email: e, hash: await hash(password) };
      write(K.users, { ...users, [e]: user });
      write(K.session, strip(user));
      emit();
      return strip(user);
    },
    async signIn(email, password) {
      const u = read<Record<string, StoredUser>>(K.users, {})[email.trim().toLowerCase()];
      if (!u || u.hash !== (await hash(password))) throw new Error("Wrong email or password.");
      write(K.session, strip(u));
      emit();
      return strip(u);
    },
    async signOut() {
      storage.removeItem(K.session);
      emit();
    },
    getLibrary: async (uid) => read<Purchase[]>(K.library(uid), []),
    async addPurchases(uid, productIds, orderId) {
      const lib = read<Purchase[]>(K.library(uid), []);
      const owned = new Set(lib.map((p) => p.productId));
      const now = new Date().toISOString();
      const fresh = productIds.filter((id) => !owned.has(id)).map((productId) => ({ productId, orderId, purchasedAt: now }));
      write(K.library(uid), [...lib, ...fresh]);
    },
    getListings: async () => read<Product[]>(K.listings, []),
    async createListing(uid, draft) {
      const err = validateDraft(draft);
      if (err) throw new Error(err);
      const p = productFromDraft(uid, current()?.name ?? "You", draft);
      write(K.listings, [p, ...read<Product[]>(K.listings, [])]);
      return p;
    },
    getReviews: async (pid) => read<Review[]>(K.reviews(pid), []),
    async addReview(productId, r) {
      const review: Review = { id: randomId("r"), productId, ...r, createdAt: new Date().toISOString() };
      write(K.reviews(productId), [review, ...read<Review[]>(K.reviews(productId), [])]);
      return review;
    },
  };
}
