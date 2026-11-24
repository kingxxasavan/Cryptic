// POST { prompt } → the GLB bytes from TRELLIS, or { error }
import { gate, json } from "@/lib/server/http";
import { trellis } from "@/lib/server/nvidia";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string; seed?: number } | null;
  const prompt = String(body?.prompt || "").replace(/\s+/g, " ").trim().slice(0, 77);
  if (!prompt) return json({ error: "Nothing to make." }, 400);
  const g = await gate(req);
  if ("res" in g) return g.res;
  const r = await trellis(prompt, Number(body?.seed) || 0);
  if ("error" in r) return json({ error: r.error }, 502);
  return new Response(r.glb as unknown as BodyInit, { headers: { "content-type": "model/gltf-binary", "cache-control": "no-store" } });
}
