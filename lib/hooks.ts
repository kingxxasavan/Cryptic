"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth";
import { getProductById } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import type { Product, Purchase } from "@/lib/types";

/** listings made by users through the creator studio */
export function useListings() {
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    getStore()
      .getListings()
      .then((l) => alive && setListings(l))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { listings, loading };
}

export function useLibrary() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = user?.uid;

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      setItems(await getStore().getLibrary(uid));
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      const t = setTimeout(() => {
        setItems([]);
        setLoading(false);
      });
      return () => clearTimeout(t);
    }
    let alive = true;
    getStore()
      .getLibrary(uid)
      .then((l) => alive && setItems(l))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [uid, authLoading]);

  return { items, loading: loading || authLoading, owns: (id: string) => items.some((i) => i.productId === id), refresh };
}

/** cart lines resolved to products, including community listings */
export function useCartProducts(lines: { productId: string }[]) {
  const { listings, loading } = useListings();
  const items = lines
    .map((l) => getProductById(l.productId) ?? listings.find((p) => p.id === l.productId))
    .filter((p): p is Product => Boolean(p));
  return { items, loading: loading && lines.some((l) => l.productId.startsWith("u_")) };
}
