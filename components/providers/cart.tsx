"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { addLine, linesAfterOrder, removeLine } from "@/lib/cart";
import type { CartLine } from "@/lib/types";

const KEY = "cryptic:cart";
const EMPTY: CartLine[] = [];

// tiny external store over localStorage so server and first client render agree
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((l) => typeof l?.productId === "string") : [];
  } catch {
    return [];
  }
}

function snapshot() {
  if (cache === null) cache = load();
  return cache;
}

function setCart(next: (l: CartLine[]) => CartLine[]) {
  cache = next(snapshot());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

interface CartCtx {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add(productId: string): void;
  remove(productId: string): void;
  removeMany(productIds: string[]): void;
  clear(): void;
  has(productId: string): boolean;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  const add = useCallback((id: string) => setCart((l) => addLine(l, id)), []);
  const remove = useCallback((id: string) => setCart((l) => removeLine(l, id)), []);
  const removeMany = useCallback((ids: string[]) => setCart((l) => linesAfterOrder(l, ids)), []);
  const clear = useCallback(() => setCart(() => []), []);

  const value = useMemo<CartCtx>(
    () => ({ lines, ready, count: lines.length, add, remove, removeMany, clear, has: (id) => lines.some((l) => l.productId === id) }),
    [lines, ready, add, remove, removeMany, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
