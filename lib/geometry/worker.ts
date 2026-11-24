// The geometry worker: builds part meshes off the main thread so dragging a
// slider never freezes the page.
import Module from "manifold-3d/manifold";
import { buildPart, type Wasm } from "./build";
import type { Part } from "@/lib/recipe/types";

const ready: Promise<Wasm> = Module({ locateFile: () => "/manifold.wasm" } as Parameters<typeof Module>[0]).then((w) => { w.setup(); return w; });

self.onmessage = async (e: MessageEvent<{ key: string; part: Part }>) => {
  const { key, part } = e.data;
  try {
    const wasm = await ready;
    const r = buildPart(wasm, part);
    if ("error" in r) { (self as unknown as Worker).postMessage({ key, error: r.error }); return; }
    (self as unknown as Worker).postMessage({ key, mesh: r.mesh, bbox: r.bbox, volume: r.volume }, [r.mesh.positions.buffer, r.mesh.indices.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ key, error: "The geometry engine failed to start: " + ((err as Error)?.message || String(err)) });
  }
};
