"use client";
// The page's side of the geometry worker: one worker, results cached by what
// actually shapes a part (its shape and sizes), so moving or recoloring a part
// never rebuilds it and a slider only rebuilds the part it belongs to.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Part } from "@/lib/recipe/types";
import type { Box3, MeshData } from "./build";

export interface Solid { mesh: MeshData; bbox: Box3; volume: number }
export interface PartBuild { solid?: Solid; error?: string; busy: boolean }

let worker: Worker | null = null;
const waiting = new Map<string, ((r: Solid | { error: string }) => void)[]>();
const cache = new Map<string, Solid | { error: string }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ key: string; error?: string; mesh?: MeshData; bbox?: Box3; volume?: number }>) => {
      const { key } = e.data;
      const result = e.data.error ? { error: e.data.error } : { mesh: e.data.mesh!, bbox: e.data.bbox!, volume: e.data.volume! };
      cache.set(key, result);
      if (cache.size > 400) cache.delete(cache.keys().next().value as string);
      (waiting.get(key) || []).forEach((fn) => fn(result));
      waiting.delete(key);
    };
  }
  return worker;
}

export function shapeKey(part: Pick<Part, "shape" | "params">): string {
  const sizes = Object.fromEntries(Object.entries(part.params || {}).map(([k, p]) => [k, p.value]));
  return JSON.stringify([part.shape, sizes]);
}

export function buildInWorker(part: Part): Promise<Solid | { error: string }> {
  const key = shapeKey(part);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const list = waiting.get(key);
    if (list) { list.push(resolve); return; }
    waiting.set(key, [resolve]);
    getWorker().postMessage({ key, part: { ...part, realistic: undefined } });
  });
}

/** Meshes for every part, keyed by part id. A part that fails keeps its last good mesh and reports the error. */
export function usePartBuilds(parts: Part[]): Record<string, PartBuild> {
  const [builds, setBuilds] = useState<Record<string, PartBuild>>({});
  const lastGood = useRef<Record<string, Solid>>({});
  const keys = useMemo(() => parts.map((p) => p.id + "\u0000" + shapeKey(p)).join("\u0001"), [parts]);

  useEffect(() => {
    let live = true;
    const ids = new Set(parts.map((p) => p.id));
    setBuilds((b) => {
      const next: Record<string, PartBuild> = {};
      for (const p of parts) next[p.id] = { ...(b[p.id] || {}), busy: true };
      return next;
    });
    for (const p of parts) {
      buildInWorker(p).then((r) => {
        if (!live || !ids.has(p.id)) return;
        if ("error" in r) setBuilds((b) => ({ ...b, [p.id]: { solid: lastGood.current[p.id], error: r.error, busy: false } }));
        else { lastGood.current[p.id] = r; setBuilds((b) => ({ ...b, [p.id]: { solid: r, busy: false } })); }
      });
    }
    return () => { live = false; };
    // keys captures everything about the parts that changes their meshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return builds;
}
