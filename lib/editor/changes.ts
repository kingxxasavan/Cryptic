// What the AI (and the editor's own buttons) can do to a project, as a list of
// small changes. A list applies all at once or not at all: every change is
// checked, then the whole project is validated, and nothing half applied is
// ever kept.
import type { Node, Param, Part, Project } from "@/lib/recipe/types";
import { validateProject } from "@/lib/recipe/validate";

export type Change =
  | { op: "set_param"; part: string; name: string; value: number; note?: string }
  | { op: "add_param"; part: string; name: string; param: Param }
  | { op: "set"; part: string; field: SettableField; value: unknown }
  | { op: "replace_shape"; part: string; shape: Node; params?: Record<string, Param> }
  | { op: "add_part"; part: Part }
  | { op: "remove_part"; part: string }
  | { op: "rename_project"; name: string };

export const SETTABLE = ["name", "purpose", "attachesTo", "material", "color", "finish", "visible", "position", "rotation"] as const;
export type SettableField = (typeof SETTABLE)[number];

export type Applied = { project: Project } | { error: string };

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function applyChanges(project: Project, changes: Change[]): Applied {
  if (!Array.isArray(changes) || !changes.length) return { error: "There were no changes to make." };
  const next = clone(project);
  const find = (id: string): Part | undefined => next.parts.find((p) => p.id === id);
  for (const [i, c] of changes.entries()) {
    const where = `change ${i + 1} (${(c as { op?: string }).op ?? "?"})`;
    if (!c || typeof c !== "object") return { error: `${where}: not a change` };
    switch (c.op) {
      case "set_param": {
        const part = find(c.part);
        if (!part) return { error: `${where}: no part "${c.part}"` };
        const p = part.params[c.name];
        if (!p) return { error: `${where}: "${part.name}" has no size "${c.name}"` };
        if (typeof c.value !== "number" || !Number.isFinite(c.value)) return { error: `${where}: ${c.name} needs a number` };
        p.value = c.value;
        if (c.value > p.max) p.max = Math.ceil(c.value * 1.25);
        if (c.value < p.min) p.min = Math.min(0, Math.floor(c.value));
        if (c.note) p.note = String(c.note).slice(0, 200);
        break;
      }
      case "add_param": {
        const part = find(c.part);
        if (!part) return { error: `${where}: no part "${c.part}"` };
        part.params[c.name] = c.param;
        break;
      }
      case "set": {
        const part = find(c.part);
        if (!part) return { error: `${where}: no part "${c.part}"` };
        if (!SETTABLE.includes(c.field)) return { error: `${where}: "${String(c.field)}" can't be set this way` };
        (part as unknown as Record<string, unknown>)[c.field] = c.value;
        break;
      }
      case "replace_shape": {
        const part = find(c.part);
        if (!part) return { error: `${where}: no part "${c.part}"` };
        part.shape = c.shape;
        if (c.params) part.params = { ...part.params, ...c.params };
        break;
      }
      case "add_part": {
        if (!c.part || typeof c.part !== "object") return { error: `${where}: no part given` };
        if (find(c.part.id)) return { error: `${where}: a part "${c.part.id}" already exists` };
        const defaults: Pick<Part, "visible" | "attachesTo" | "purpose" | "finish" | "position" | "rotation"> = { visible: true, attachesTo: [], purpose: "", finish: "matte", position: [0, 0, 0], rotation: [0, 0, 0] };
        next.parts.push(Object.assign(defaults, c.part) as Part);
        break;
      }
      case "remove_part": {
        if (!find(c.part)) return { error: `${where}: no part "${c.part}"` };
        next.parts = next.parts.filter((p) => p.id !== c.part);
        next.parts.forEach((p) => { p.attachesTo = (p.attachesTo || []).filter((a) => a !== c.part); });
        break;
      }
      case "rename_project": {
        if (typeof c.name !== "string" || !c.name.trim()) return { error: `${where}: needs a name` };
        next.name = c.name.trim().slice(0, 120);
        break;
      }
      default: return { error: `${where}: unknown change "${String((c as { op?: string }).op)}"` };
    }
  }
  next.updatedAt = Date.now();
  const v = validateProject(next);
  if (!v.ok) return { error: v.errors.slice(0, 6).join("; ") };
  return { project: v.project };
}
