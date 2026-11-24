"use client";
// Who's signed in, for the whole app. Firebase Auth loads only in the browser.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User as FbUser } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

export interface Me { uid: string; email: string; name: string; photo: string }
interface AuthApi {
  me: Me | null;
  ready: boolean;
  signInGoogle(): Promise<void>;
  signInEmail(email: string, password: string, create: boolean, name?: string): Promise<void>;
  signOut(): Promise<void>;
  token(): Promise<string | null>;
}

const Ctx = createContext<AuthApi | null>(null);
let current: FbUser | null = null;

async function auth() {
  const app = await getFirebaseApp();
  const m = await import("firebase/auth");
  return { a: m.getAuth(app), m };
}

const friendly = (e: unknown) => {
  const code = String((e as { code?: string })?.code || "");
  if (/invalid-credential|wrong-password|user-not-found/.test(code)) return "That email and password don't match.";
  if (/email-already-in-use/.test(code)) return "There's already an account with that email. Sign in instead.";
  if (/weak-password/.test(code)) return "Use a password of at least 6 characters.";
  if (/popup-closed|cancelled-popup/.test(code)) return "The sign in window was closed.";
  if (/unauthorized-domain/.test(code)) return "This site's address isn't on Firebase's authorised domains yet (see the README).";
  if (/operation-not-allowed/.test(code)) return "That sign in method isn't switched on in Firebase yet (see the README).";
  return (e as Error)?.message || "Couldn't sign in.";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = () => {};
    // If Firebase can't be reached, carry on signed out rather than waiting forever.
    const giveUp = setTimeout(() => setReady(true), 4000);
    auth().then(({ a, m }) => {
      stop = m.onAuthStateChanged(a, (u) => {
        current = u;
        setMe(u ? { uid: u.uid, email: u.email || "", name: u.displayName || (u.email || "").split("@")[0], photo: u.photoURL || "" } : null);
        setReady(true);
      });
    }).catch(() => setReady(true));
    return () => { stop(); clearTimeout(giveUp); };
  }, []);
  const api = useMemo<AuthApi>(() => ({
    me, ready,
    async signInGoogle() {
      const { a, m } = await auth();
      try { await m.signInWithPopup(a, new m.GoogleAuthProvider()); } catch (e) { throw new Error(friendly(e)); }
    },
    async signInEmail(email, password, create, name) {
      const { a, m } = await auth();
      try {
        if (create) {
          const r = await m.createUserWithEmailAndPassword(a, email, password);
          if (name) await m.updateProfile(r.user, { displayName: name });
        } else await m.signInWithEmailAndPassword(a, email, password);
      } catch (e) { throw new Error(friendly(e)); }
    },
    async signOut() { const { a, m } = await auth(); await m.signOut(a); },
    async token() { return current ? current.getIdToken() : null; },
  }), [me, ready]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
