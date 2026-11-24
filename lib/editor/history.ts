// Undo and redo as an immutable value: every edit pushes a whole project, so
// undo is exact (projects are small; 100 steps is plenty).
import type { Project } from "@/lib/recipe/types";

const MAX = 100;

export interface History {
  present: Project;
  canUndo: boolean;
  canRedo: boolean;
  push(next: Project): History;
  /** Replace the present without a new undo step (a slider still being dragged). */
  replace(next: Project): History;
  undo(): History;
  redo(): History;
}

function make(past: Project[], present: Project, future: Project[]): History {
  return {
    present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    push: (next) => make([...past, present].slice(-MAX), next, []),
    replace: (next) => make(past, next, future),
    undo: () => (past.length ? make(past.slice(0, -1), past[past.length - 1], [present, ...future]) : make(past, present, future)),
    redo: () => (future.length ? make([...past, present], future[0], future.slice(1)) : make(past, present, future)),
  };
}

export function history(start: Project): History {
  return make([], start, []);
}
