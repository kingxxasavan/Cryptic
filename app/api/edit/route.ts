// POST { project, selected?, request, recent? } → { changes, message, project, model, label } or { error }
import { gate, json } from "@/lib/server/http";
import { editProject } from "@/lib/server/design";
import { validateProject } from "@/lib/recipe/validate";
import type { Msg } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { project?: unknown; selected?: string | null; request?: string; recent?: Msg[] } | null;
  const request = String(body?.request || "").trim().slice(0, 4000);
  if (!request) return json({ error: "Say what to change." }, 400);
  const v = validateProject(body?.project);
  if (!v.ok) return json({ error: "That project doesn't look right: " + v.errors.slice(0, 3).join("; ") }, 400);
  const g = await gate(req);
  if ("res" in g) return g.res;
  const recent = (Array.isArray(body?.recent) ? body!.recent : []).filter((m) => m && (m.role === "user" || m.role === "assistant")).slice(-6)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  try {
    const r = await editProject({ project: v.project, selected: body?.selected || null, request, recent });
    return json({ ...r, left: g.left });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
}
