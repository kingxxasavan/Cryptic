"use client";
// The browser's side of the AI routes.
import type { Project } from "@/lib/recipe/types";
import type { Change } from "@/lib/editor/changes";
import type { Msg } from "./prompts";

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
}

async function errorOf(res: Response): Promise<string> {
  const d = (await res.json().catch(() => ({}))) as { error?: string };
  return d.error || `The server answered ${res.status}.`;
}

export async function designWithAI(o: { description: string; brief: string; name?: string; id: string },
  on: { step?: (s: string) => void; model?: (label: string) => void }, signal?: AbortSignal): Promise<Project> {
  const res = await post("/api/design", o, signal);
  if (!res.ok || !res.body) throw new Error(await errorOf(res));
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line) as { step?: string; label?: string; project?: Project; error?: string };
      if (msg.error) throw new Error(msg.error);
      if (msg.step) on.step?.(msg.step);
      if (msg.label) on.model?.(msg.label);
      if (msg.project) return msg.project;
    }
  }
  throw new Error("The design stopped before it finished. Try again.");
}

export async function editWithAI(o: { project: Project; selected: string | null; request: string; recent: Msg[] }, signal?: AbortSignal):
  Promise<{ changes: Change[]; message: string; project: Project; label: string }> {
  const project = { ...o.project, parts: o.project.parts.map((p) => ({ ...p, realistic: undefined })) };
  const res = await post("/api/edit", { ...o, project: JSON.parse(JSON.stringify(project)) }, signal);
  if (!res.ok) throw new Error(await errorOf(res));
  return res.json();
}

export async function realisticWithAI(prompt: string, signal?: AbortSignal): Promise<Uint8Array> {
  const res = await post("/api/realistic", { prompt, seed: Math.floor(Math.random() * 1e6) }, signal);
  if (!res.ok) throw new Error(await errorOf(res));
  return new Uint8Array(await res.arrayBuffer());
}
