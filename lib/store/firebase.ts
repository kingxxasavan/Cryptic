import { getFirebaseApp } from "@/lib/firebase";
import { productFromDraft, randomId, validateDraft } from "@/lib/store/listing";
import type { DataStore } from "@/lib/store/types";
import type { Product, Purchase, Review, User } from "@/lib/types";
import type { User as FbUser } from "firebase/auth";

const ROOT = "cryptic";

function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

const toUser = (u: FbUser): User => ({ uid: u.uid, name: u.displayName ?? u.email?.split("@")[0] ?? "Member", email: u.email ?? "" });

const friendly = (e: unknown): never => {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/invalid-email": "That email doesn't look right.",
    "auth/weak-password": "Password needs at least 6 characters.",
    "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
  };
  if (map[code]) throw Object.assign(new Error(map[code]), { code });
  throw e;
};

export function createFirebaseStore(): DataStore {
  const auth = async () => {
    const [{ getAuth }, app] = await Promise.all([import("firebase/auth"), getFirebaseApp()]);
    return getAuth(app);
  };
  const db = async () => {
    const [mod, app] = await Promise.all([import("firebase/database"), getFirebaseApp()]);
    return { ...mod, db: mod.getDatabase(app) };
  };
  const readVal = async <T,>(path: string): Promise<T | null> => {
    const { get, ref, db: d } = await db();
    const snap = await withTimeout(get(ref(d, `${ROOT}/${path}`)));
    return snap.exists() ? (snap.val() as T) : null;
  };
  const writeVal = async (path: string, value: unknown) => {
    const { set, ref, db: d } = await db();
    await withTimeout(set(ref(d, `${ROOT}/${path}`), value));
  };

  return {
    name: "firebase",
    async getUser() {
      const a = await auth();
      await withTimeout(a.authStateReady());
      return a.currentUser ? toUser(a.currentUser) : null;
    },
    onUser(cb) {
      let off = () => {};
      let dead = false;
      auth()
        .then(async (a) => {
          const { onAuthStateChanged } = await import("firebase/auth");
          if (!dead) off = onAuthStateChanged(a, (u) => cb(u ? toUser(u) : null), () => cb(null));
        })
        .catch(() => cb(null));
      return () => {
        dead = true;
        off();
      };
    },
    async signUp(name, email, password) {
      const a = await auth();
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const cred = await withTimeout(createUserWithEmailAndPassword(a, email.trim(), password)).catch(friendly);
      await updateProfile(cred.user, { displayName: name.trim() });
      const user = { ...toUser(cred.user), name: name.trim() || toUser(cred.user).name };
      await writeVal(`users/${user.uid}`, { name: user.name, email: user.email, joinedAt: new Date().toISOString() }).catch(() => {});
      return user;
    },
    async signIn(email, password) {
      const a = await auth();
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const cred = await withTimeout(signInWithEmailAndPassword(a, email.trim(), password)).catch(friendly);
      return toUser(cred.user);
    },
    async signOut() {
      const a = await auth();
      await a.signOut();
    },
    async getLibrary(uid) {
      return Object.values((await readVal<Record<string, Purchase>>(`library/${uid}`)) ?? {});
    },
    async addPurchases(uid, productIds, orderId) {
      const owned = (await readVal<Record<string, Purchase>>(`library/${uid}`)) ?? {};
      const now = new Date().toISOString();
      const { update, ref, db: d } = await db();
      const patch: Record<string, Purchase> = {};
      for (const id of productIds) if (!owned[id]) patch[id] = { productId: id, orderId, purchasedAt: now };
      if (Object.keys(patch).length) await withTimeout(update(ref(d, `${ROOT}/library/${uid}`), patch));
    },
    async getListings() {
      const all = (await readVal<Record<string, Product>>("listings")) ?? {};
      return Object.values(all)
        .map((p) => ({ ...p, tags: p.tags ?? [], contents: p.contents ?? [] }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createListing(uid, draft) {
      const err = validateDraft(draft);
      if (err) throw new Error(err);
      const a = await auth();
      const p = productFromDraft(uid, a.currentUser?.displayName ?? "Creator", draft);
      await writeVal(`listings/${p.id}`, { ...p, ownerUid: uid });
      return p;
    },
    async getReviews(productId) {
      const all = (await readVal<Record<string, Review>>(`reviews/${productId}`)) ?? {};
      return Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async addReview(productId, r) {
      const review: Review = { id: randomId("r"), productId, ...r, createdAt: new Date().toISOString() };
      await writeVal(`reviews/${productId}/${review.id}`, review);
      return review;
    },
  };
}
