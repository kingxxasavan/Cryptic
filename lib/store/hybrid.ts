import type { DataStore, HybridStore, StoreMode } from "@/lib/store/types";
import type { User } from "@/lib/types";

// errors that mean "firebase isn't set up or reachable", not "the user typed something wrong"
const INFRA = [
  "permission_denied",
  "permission-denied",
  "auth/operation-not-allowed",
  "auth/configuration-not-found",
  "auth/admin-restricted-operation",
  "auth/network-request-failed",
  "auth/api-key-not-valid",
  "auth/internal-error",
  "timeout",
  "unavailable",
];

export function isInfraError(e: unknown): boolean {
  const code = String((e as { code?: string })?.code ?? "").toLowerCase();
  const msg = String((e as Error)?.message ?? "").toLowerCase();
  return INFRA.some((k) => code.includes(k) || msg.includes(k));
}

export function createHybridStore(primary: DataStore, fallback: DataStore, startLocal = false): HybridStore {
  // auth and data degrade separately: firebase auth can work while the database rules still deny
  let dataMode: StoreMode = startLocal ? "local" : "firebase";
  let authLocal = startLocal;
  let warned = false;
  const modeListeners = new Set<(m: StoreMode) => void>();
  const pushers = new Set<() => void>();

  const warn = (e: unknown) => {
    if (!warned && typeof console !== "undefined") {
      warned = true;
      console.info("[cryptic] Firebase unavailable, using browser storage instead.", e);
    }
  };
  const degradeData = (e: unknown) => {
    warn(e);
    if (dataMode === "local") return;
    dataMode = "local";
    modeListeners.forEach((cb) => cb(dataMode));
  };
  const degradeAuth = (e: unknown) => {
    degradeData(e);
    if (authLocal) return;
    authLocal = true;
    pushers.forEach((p) => p());
  };

  async function run<T>(call: (s: DataStore) => Promise<T>): Promise<T> {
    if (dataMode === "local") return call(fallback);
    try {
      return await call(primary);
    } catch (e) {
      if (!isInfraError(e)) throw e;
      degradeData(e);
      return call(fallback);
    }
  }

  async function runAuth<T>(call: (s: DataStore) => Promise<T>): Promise<T> {
    if (authLocal) return call(fallback);
    try {
      return await call(primary);
    } catch (e) {
      if (!isInfraError(e)) throw e;
      degradeAuth(e);
      return call(fallback);
    }
  }

  return {
    name: "firebase",
    mode: () => dataMode,
    onMode(cb) {
      modeListeners.add(cb);
      cb(dataMode);
      return () => modeListeners.delete(cb);
    },
    getUser: () => runAuth((s) => s.getUser()),
    onUser(cb) {
      let p: User | null = null;
      let f: User | null = null;
      const push = () => cb(authLocal ? f : (p ?? f));
      pushers.add(push);
      const offF = fallback.onUser((u) => {
        f = u;
        push();
      });
      const offP = startLocal
        ? () => {}
        : primary.onUser((u) => {
            p = u;
            push();
          });
      return () => {
        pushers.delete(push);
        offF();
        offP();
      };
    },
    signUp: (n, e, pw) => runAuth((s) => s.signUp(n, e, pw)),
    signIn: (e, pw) => runAuth((s) => s.signIn(e, pw)),
    async signOut() {
      await Promise.allSettled([primary.signOut(), fallback.signOut()]);
    },
    getLibrary: (uid) => run((s) => s.getLibrary(uid)),
    addPurchases: (uid, ids, o) => run((s) => s.addPurchases(uid, ids, o)),
    getListings: () => run((s) => s.getListings()),
    createListing: (uid, d) => run((s) => s.createListing(uid, d)),
    getReviews: (pid) => run((s) => s.getReviews(pid)),
    addReview: (pid, r) => run((s) => s.addReview(pid, r)),
  };
}
