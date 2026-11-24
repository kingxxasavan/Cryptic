// NVIDIA's hosted models, picked per request. Model ids get retired every few
// weeks, so the site never pins one: it ranks families, checks them against
// the live catalogue, and moves to the next on any failure.
import "server-only";
import type { Msg } from "@/lib/ai/prompts";

const BASE = "https://integrate.api.nvidia.com/v1";
const key = () => (process.env.NVIDIA_API_KEY || "").trim();

// Strongest first for writing structured designs. A family is a pattern, so
// "the newest DeepSeek" keeps meaning something after one id is retired.
const FAMILIES: RegExp[] = [
  /deepseek-v3\.\d/i, /deepseek-v3/i, /qwen3-coder-480b/i, /qwen3-235b/i, /kimi-k2/i,
  /gpt-oss-120b/i, /nemotron.*ultra/i, /llama-4-maverick/i, /mistral-large/i, /qwen3/i, /llama-3\.3-70b/i,
];
const FALLBACK_IDS = ["deepseek-ai/deepseek-v3.1", "qwen/qwen3-coder-480b-a35b-instruct", "moonshotai/kimi-k2-instruct", "openai/gpt-oss-120b", "meta/llama-3.3-70b-instruct"];
const NOT_CHAT = /embed|rerank|vision|vl\b|guard|safety|reward|parse|ocr|clip|whisper|tts|asr|retriever|nemoretriever|image|flux|stable|trellis|cosmos/i;

let catalogue: { ids: string[]; at: number } | null = null;
const benched = new Map<string, number>();

export function nvidiaReady(): boolean { return key().length > 0; }

async function listModels(): Promise<string[]> {
  if (catalogue && Date.now() - catalogue.at < 10 * 60e3) return catalogue.ids;
  try {
    const res = await fetch(BASE + "/models", { headers: { authorization: "Bearer " + key() }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { data?: { id: string }[] };
    const ids = (data.data || []).map((m) => m.id).filter((id) => !NOT_CHAT.test(id));
    catalogue = { ids, at: Date.now() };
    return ids;
  } catch {
    return catalogue?.ids || [];
  }
}

export async function candidates(): Promise<string[]> {
  const pinned = (process.env.PARTS_MODEL || "").trim();
  const ids = await listModels();
  const out: string[] = [];
  if (pinned) out.push(pinned);
  for (const fam of FAMILIES) {
    const hits = ids.filter((id) => fam.test(id)).sort().reverse();
    for (const h of hits) if (!out.includes(h)) out.push(h);
  }
  if (!ids.length) for (const id of FALLBACK_IDS) if (!out.includes(id)) out.push(id);
  return out.filter((id) => (benched.get(id) || 0) < Date.now()).slice(0, 6);
}

export interface ChatResult { text: string; model: string }

/** One chat completion, trying models in order until one answers. */
export async function chat(messages: Msg[], opts: { maxTokens?: number; temperature?: number; timeoutMs?: number; json?: boolean } = {}): Promise<ChatResult> {
  if (!nvidiaReady()) throw new Error("NVIDIA_API_KEY isn't set on the server. Add it in Vercel → Settings → Environment Variables and redeploy.");
  const models = await candidates();
  let last = "No model answered.";
  // One time limit for every try together, so falling back never runs past it.
  const end = Date.now() + (opts.timeoutMs ?? 150000);
  for (const model of models) {
    const remaining = end - Date.now();
    if (remaining < 4000) { last += " (ran out of time trying models)"; break; }
    try {
      const res = await fetch(BASE + "/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + key() },
        body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 8000, temperature: opts.temperature ?? 0.3, stream: false }),
        signal: AbortSignal.timeout(remaining),
      });
      if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        last = `${model} answered ${res.status}: ${body}`;
        if ([404, 410, 400, 422, 429].includes(res.status) || res.status >= 500) benched.set(model, Date.now() + (res.status === 429 ? 60e3 : 10 * 60e3));
        continue;
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
      const text = data.choices?.[0]?.message?.content || "";
      if (!text.trim()) { last = `${model} returned an empty answer`; continue; }
      return { text, model };
    } catch (e) {
      last = `${model}: ${(e as Error).name === "TimeoutError" ? "took too long" : (e as Error).message}`;
      benched.set(model, Date.now() + 2 * 60e3);
    }
  }
  throw new Error(last);
}

/** A short readable label for a model id ("deepseek-ai/deepseek-v3.1" → "DeepSeek V3.1"). */
export function modelLabel(id: string): string {
  const name = id.split("/").pop() || id;
  return name.replace(/-instruct.*$/i, "").replace(/-a\d+b$/i, "").split("-").map((w) => (/^v?\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ").replace(/^Deepseek/, "DeepSeek").replace(/^Gpt Oss/, "GPT-OSS").replace(/^Qwen3/, "Qwen 3");
}

// ---- TRELLIS --------------------------------------------------------------------
// Text to 3D, hosted. Reported flaky at times, so failures come back as plain
// messages and the exact shape stays.
export async function trellis(prompt: string, seed = 0): Promise<{ glb: Uint8Array } | { error: string }> {
  if (!nvidiaReady()) return { error: "NVIDIA_API_KEY isn't set on the server." };
  try {
    const res = await fetch("https://ai.api.nvidia.com/v1/genai/microsoft/trellis", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: "Bearer " + key() },
      body: JSON.stringify({ prompt: prompt.slice(0, 77), mode: "text", seed }),
      signal: AbortSignal.timeout(240000),
    });
    const type = res.headers.get("content-type") || "";
    if (!res.ok) return { error: `TRELLIS answered ${res.status}${res.status >= 500 ? " (NVIDIA's 3D service is having trouble; try again later)" : ""}.` };
    if (/model\/gltf-binary|octet-stream/.test(type)) return { glb: new Uint8Array(await res.arrayBuffer()) };
    const data = (await res.json()) as { artifacts?: { base64?: string }[]; glb?: string; data?: string };
    const b64 = data.artifacts?.[0]?.base64 || data.glb || data.data;
    if (!b64) return { error: "TRELLIS answered without a model." };
    return { glb: new Uint8Array(Buffer.from(b64, "base64")) };
  } catch (e) {
    return { error: (e as Error).name === "TimeoutError" ? "TRELLIS took too long." : "Couldn't reach TRELLIS: " + (e as Error).message };
  }
}
