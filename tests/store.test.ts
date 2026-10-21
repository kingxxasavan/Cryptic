import { beforeEach, describe, expect, it } from "vitest";
import { createLocalStore, hasLocalSession, memoryStorage } from "@/lib/store/local";
import { createHybridStore } from "@/lib/store/hybrid";
import type { DataStore } from "@/lib/store/types";
import type { ListingDraft } from "@/lib/types";

const draft: ListingDraft = {
  title: "My Great Skill!",
  tagline: "Does a thing",
  description: "A long enough description of the thing.",
  category: "claude-skills",
  priceCents: 1500,
  tags: ["test"],
};

describe("local store", () => {
  let store: DataStore;
  beforeEach(() => {
    store = createLocalStore(memoryStorage());
  });

  it("signs up, reports the user, and signs out", async () => {
    const u = await store.signUp("Ada", "ADA@example.com", "secret123");
    expect(u.email).toBe("ada@example.com");
    expect((await store.getUser())?.uid).toBe(u.uid);
    await store.signOut();
    expect(await store.getUser()).toBeNull();
  });

  it("rejects wrong password and duplicate email", async () => {
    await store.signUp("Ada", "ada@example.com", "secret123");
    await store.signOut();
    await expect(store.signIn("ada@example.com", "nope")).rejects.toThrow("Wrong email or password");
    await expect(store.signUp("Ada2", "ada@example.com", "secret123")).rejects.toThrow("already has an account");
    const back = await store.signIn("ada@example.com", "secret123");
    expect(back.name).toBe("Ada");
  });

  it("notifies onUser listeners", async () => {
    const seen: (string | null)[] = [];
    const off = store.onUser((u) => seen.push(u?.name ?? null));
    await store.signUp("Ada", "ada@example.com", "secret123");
    await store.signOut();
    off();
    expect(seen).toEqual([null, "Ada", null]);
  });

  it("stores purchases without duplicates", async () => {
    await store.addPurchases("u1", ["p001", "p002"], "ord_1");
    await store.addPurchases("u1", ["p002"], "ord_2");
    const lib = await store.getLibrary("u1");
    expect(lib.map((p) => p.productId).sort()).toEqual(["p001", "p002"]);
    expect(await store.getLibrary("someone-else")).toEqual([]);
  });

  it("creates listings that show up in getListings", async () => {
    const p = await store.createListing("u1", draft);
    expect(p.userMade).toBe(true);
    expect(p.slug).toMatch(/^my-great-skill-/);
    expect(p.priceCents).toBe(1500);
    expect((await store.getListings()).map((x) => x.id)).toContain(p.id);
  });

  it("adds and lists reviews per product", async () => {
    await store.addReview("p001", { author: "Ada", rating: 5, body: "Great" });
    expect(await store.getReviews("p001")).toHaveLength(1);
    expect(await store.getReviews("p002")).toEqual([]);
  });
});

const infra = () => Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED" });

function brokenPrimary(errorFactory: () => Error): DataStore {
  const fail = async () => {
    throw errorFactory();
  };
  return {
    name: "firebase",
    getUser: async () => null,
    onUser: (cb) => {
      cb(null);
      return () => {};
    },
    signUp: fail,
    signIn: fail,
    signOut: async () => {},
    getLibrary: fail,
    addPurchases: fail,
    getListings: fail,
    createListing: fail,
    getReviews: fail,
    addReview: fail,
  };
}

describe("hybrid store", () => {
  it("falls back to local when firebase has an infra error", async () => {
    const local = createLocalStore(memoryStorage());
    const store = createHybridStore(brokenPrimary(infra), local);
    expect(store.mode()).toBe("firebase");
    const u = await store.signUp("Ada", "ada@example.com", "secret123");
    expect(u.name).toBe("Ada");
    expect(store.mode()).toBe("local");
    expect((await local.getUser())?.uid).toBe(u.uid);
  });

  it("falls back for data calls too", async () => {
    const local = createLocalStore(memoryStorage());
    const store = createHybridStore(brokenPrimary(infra), local);
    await store.addPurchases("u1", ["p001"], "ord_1");
    expect((await store.getLibrary("u1")).map((p) => p.productId)).toEqual(["p001"]);
    expect(store.mode()).toBe("local");
  });

  it("tells mode listeners when it falls back", async () => {
    const store = createHybridStore(brokenPrimary(infra), createLocalStore(memoryStorage()));
    const seen: string[] = [];
    const off = store.onMode((m) => seen.push(m));
    await store.getListings();
    off();
    expect(seen).toEqual(["firebase", "local"]);
  });

  describe("mixed mode: firebase auth works but the database denies", () => {
    function authOkDataDenied() {
      const fbUser = { uid: "fb_uid_123456", name: "Ada", email: "ada@example.com" };
      let emit: (u: typeof fbUser | null) => void = () => {};
      let current: typeof fbUser | null = null;
      const p = brokenPrimary(infra);
      p.onUser = (cb) => {
        emit = (u) => {
          current = u;
          cb(u);
        };
        return () => {};
      };
      p.getUser = async () => current;
      p.signIn = async () => {
        emit(fbUser);
        return fbUser;
      };
      return { p, fbUser, emitUser: () => emit(fbUser) };
    }

    it("keeps the firebase user when the db is denied before auth reports in", async () => {
      const { p, fbUser, emitUser } = authOkDataDenied();
      const store = createHybridStore(p, createLocalStore(memoryStorage()));
      const seen: (string | null)[] = [];
      store.onUser((u) => seen.push(u?.uid ?? null));
      await store.getListings();
      emitUser();
      expect(seen.at(-1)).toBe(fbUser.uid);
      expect((await store.getUser())?.uid).toBe(fbUser.uid);
      expect(store.mode()).toBe("local");
    });

    it("keeps the firebase user when auth reports first and the db is denied after", async () => {
      const { p, fbUser, emitUser } = authOkDataDenied();
      const store = createHybridStore(p, createLocalStore(memoryStorage()));
      const seen: (string | null)[] = [];
      store.onUser((u) => seen.push(u?.uid ?? null));
      emitUser();
      await store.getListings();
      expect(seen.at(-1)).toBe(fbUser.uid);
    });

    it("still signs in against firebase after the db degraded", async () => {
      const { p, fbUser } = authOkDataDenied();
      const store = createHybridStore(p, createLocalStore(memoryStorage()));
      await store.getListings();
      expect((await store.signIn("ada@example.com", "secret123")).uid).toBe(fbUser.uid);
    });
  });

  it("passes user errors through without switching mode", async () => {
    const userErr = () => Object.assign(new Error("taken"), { code: "auth/email-already-in-use" });
    const store = createHybridStore(brokenPrimary(userErr), createLocalStore(memoryStorage()));
    await expect(store.signUp("Ada", "ada@example.com", "secret123")).rejects.toThrow();
    expect(store.mode()).toBe("firebase");
  });

  it("starts in local mode when a local session already exists", async () => {
    const storage = memoryStorage();
    const local = createLocalStore(storage);
    await local.signUp("Ada", "ada@example.com", "secret123");
    const store = createHybridStore(brokenPrimary(infra), createLocalStore(storage), hasLocalSession(storage));
    expect(store.mode()).toBe("local");
    expect((await store.getUser())?.name).toBe("Ada");
  });
});
