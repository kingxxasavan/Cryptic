"use client";
// The page's side of the geometry worker: one worker, results cached by what
// actually shapes a part (its shape and sizes), so moving or recoloring a part
// never rebuilds it and a slider only rebuilds the part it belongs to.
import { useEffect, useMemo, useState } from "react";
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

// The last mesh that built for each part id, kept when a later edit fails.
const lastGood = new Map<string, Solid>();
const views = new WeakMap<object, PartBuild>();

function viewOf(id: string, r: Solid | { error: string } | undefined): PartBuild {
  if (r && !("error" in r)) {
    lastGood.set(id, r);
    let v = views.get(r);
    if (!v) { v = { solid: r, busy: false }; views.set(r, v); }
    return v;
  }
  return { solid: lastGood.get(id), error: r ? r.error : undefined, busy: !r };
}

/** Meshes for every part, keyed by part id. A part that fails keeps its last good mesh and reports the error. */
export function usePartBuilds(parts: Part[]): Record<string, PartBuild> {
  const [version, setVersion] = useState(0);
  const keys = useMemo(() => parts.map((p) => p.id + "\u0000" + shapeKey(p)).join("\u0001"), [parts]);

  useEffect(() => {
    let live = true;
    for (const p of parts) if (!cache.has(shapeKey(p))) buildInWorker(p).then(() => { if (live) setVersion((n) => n + 1); });
    return () => { live = false; };
    // keys captures everything about the parts that changes their meshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return useMemo(() => {
    const out: Record<string, PartBuild> = {};
    for (const p of parts) out[p.id] = viewOf(p.id, cache.get(shapeKey(p)));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, version]);
}
