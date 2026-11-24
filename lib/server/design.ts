// The design pipeline: plan research → search and read → pull out facts →
// design every part → validate (one repair round). Each step reports progress
// so the page can show what's happening during the minute this takes.
import "server-only";
import { chat, modelLabel } from "./nvidia";
import { research } from "./search";
import { extractJson } from "@/lib/ai/json";
import { designMessages, editMessages, factMessages, finishProject, queryMessages, repairMessages, type Msg } from "@/lib/ai/prompts";
import { validateProject } from "@/lib/recipe/validate";
import { applyChanges, type Change } from "@/lib/editor/changes";
import type { Fact, Project } from "@/lib/recipe/types";

export type Emit = (line: Record<string, unknown>) => void;

export async function designProject(o: { description: string; brief: string; name?: string; id: string }, emit: Emit): Promise<Project> {
  // 1. What to look up.
  emit({ step: "Planning the research" });
  let queries: string[] = [];
  try {
    const q = await chat(queryMessages(o.description, o.brief), { maxTokens: 600, timeoutMs: 40000 });
    const got = extractJson(q.text) as { queries?: unknown } | null;
    if (got && Array.isArray(got.queries)) queries = got.queries.map(String).filter(Boolean).slice(0, 6);
  } catch { /* fall back below */ }
  if (!queries.length) queries = [`${o.description} dimensions mm`, `${o.description} parts list`, `${o.description} how it's made`];

  // 2. Search and read.
  const { pages } = await research(queries, (s) => emit({ step: s }));

  // 3. Facts with their links.
  let facts: Fact[] = [];
  if (pages.length) {
    emit({ step: `Pulling sizes out of ${pages.length} sources` });
    try {
      const f = await chat(factMessages(o.description, pages), { maxTokens: 3000, timeoutMs: 60000 });
      const got = extractJson(f.text) as { facts?: { text?: string; url?: string; title?: string }[] } | null;
      facts = (got?.facts || []).filter((x) => x && x.text && x.url && pages.some((p) => p.url === x.url))
        .slice(0, 25).map((x, i) => ({ id: "f" + (i + 1), text: String(x.text).slice(0, 400), url: String(x.url), title: String(x.title || "").slice(0, 160) }));
    } catch { /* design without facts */ }
  }
  emit({ step: facts.length ? `Found ${facts.length} facts` : "Research came back empty, so every size will be marked estimated", facts: facts.length });

  // 4. Design.
  emit({ step: "Designing every part" });
  const messages = designMessages({ description: o.description, brief: o.brief, facts, name: o.name });
  let reply = await chat(messages, { maxTokens: 16000, timeoutMs: 170000 });
  emit({ model: reply.model, label: modelLabel(reply.model) });
  let project = finishProject(extractJson(reply.text), { ...o, facts });
  let v = validateProject(project);
  if (!v.ok || !project.parts.length) {
    const errors = v.ok ? ["there were no parts"] : v.errors;
    emit({ step: "Fixing " + errors.length + " problem" + (errors.length === 1 ? "" : "s") + " in the design" });
    reply = await chat(repairMessages(messages, reply.text, errors), { maxTokens: 16000, timeoutMs: 120000 });
    project = finishProject(extractJson(reply.text), { ...o, facts });
    v = validateProject(project);
    if (!v.ok || !project.parts.length) throw new Error("The AI's design didn't hold together: " + (v.ok ? "no parts" : v.errors.slice(0, 4).join("; ")) + ". Try again, or describe it a little differently.");
  }
  return v.project;
}

export async function editProject(o: { project: Project; selected?: string | null; request: string; recent?: Msg[] }): Promise<{ changes: Change[]; message: string; project: Project; model: string; label: string }> {
  const messages = editMessages(o);
  let reply = await chat(messages, { maxTokens: 8000, timeoutMs: 120000 });
  for (let attempt = 0; attempt < 2; attempt++) {
    const got = extractJson(reply.text) as { changes?: Change[]; message?: string } | null;
    const changes = Array.isArray(got?.changes) ? got!.changes : [];
    const applied = changes.length ? applyChanges(o.project, changes) : { error: "there were no changes in the reply" };
    if ("project" in applied) return { changes, message: String(got?.message || "Done."), project: applied.project, model: reply.model, label: modelLabel(reply.model) };
    if (attempt === 1) throw new Error("The AI's change didn't work: " + applied.error);
    reply = await chat(repairMessages(messages, reply.text, [applied.error]), { maxTokens: 8000, timeoutMs: 90000 });
  }
  throw new Error("unreachable");
}
