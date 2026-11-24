// POST { description, brief?, name? } → NDJSON: { step } … { project } or { error }
import { gate, json, ndjson } from "@/lib/server/http";
import { designProject } from "@/lib/server/design";
import { LIMITS } from "@/lib/recipe/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { description?: string; brief?: string; name?: string; id?: string } | null;
  const description = String(body?.description || "").trim().slice(0, 2000);
  if (!description) return json({ error: "Describe what you're building first." }, 400);
  const brief = String(body?.brief || "").slice(0, LIMITS.brief);
  const g = await gate(req);
  if ("res" in g) return g.res;
  const id = /^[A-Za-z0-9_-]{6,40}$/.test(String(body?.id)) ? String(body!.id) : crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return ndjson(async (emit) => {
    emit({ left: g.left });
    const project = await designProject({ description, brief, name: body?.name ? String(body.name).slice(0, 120) : undefined, id }, emit);
    project.owner = g.user.uid;
    emit({ project });
  });
}
