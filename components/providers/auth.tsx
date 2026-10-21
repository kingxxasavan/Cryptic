"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStore } from "@/lib/store";
import type { StoreMode } from "@/lib/store/types";
import type { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  mode: StoreMode;
  signIn(email: string, password: string): Promise<User>;
  signUp(name: string, email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<StoreMode>("firebase");

  useEffect(() => {
    const store = getStore();
    let settled = false;
    // firebase reports the first auth state async; local reports right away with null
    // so only stop "loading" once something real comes back or a short wait passes
    const t = setTimeout(() => setLoading(false), 1500);
    const off = store.onUser((u) => {
      setUser(u);
      setMode(store.mode());
      if (u || settled) setLoading(false);
      settled = true;
    });
    const offMode = store.onMode(setMode);
    return () => {
      clearTimeout(t);
      off();
      offMode();
    };
  }, []);

  const wrap = useCallback(<A extends unknown[], R>(fn: (...a: A) => Promise<R>) => async (...a: A) => {
    const r = await fn(...a);
    const store = getStore();
    setMode(store.mode());
    setUser(await store.getUser());
    setLoading(false);
    return r;
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      mode,
      signIn: wrap((e: string, p: string) => getStore().signIn(e, p)),
      signUp: wrap((n: string, e: string, p: string) => getStore().signUp(n, e, p)),
      signOut: wrap(() => getStore().signOut()),
    }),
    [user, loading, mode, wrap],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
