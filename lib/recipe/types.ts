// The recipe: what a project and its parts are, as plain data. The AI writes
// it, the editor changes it, the geometry worker builds meshes from it, and a
// shared link sends it. Nothing in here is ever run as code.

/** A number, or an expression over the part's params ("length - 2 * wall"). */
export type Num = number | string;
export type Vec3 = [number, number, number];
export type Vec3N = [Num, Num, Num];

export type Node =
  | { type: "box"; w: Num; d: Num; h: Num }
  | { type: "cylinder"; d: Num; h: Num; segments?: number }
  | { type: "tube"; od: Num; id: Num; h: Num; segments?: number }
  | { type: "sphere"; d: Num; segments?: number }
  | { type: "cone"; d1: Num; d2: Num; h: Num; segments?: number }
  | { type: "torus"; D: Num; d: Num; segments?: number }
  | { type: "extrude"; points: [Num, Num][]; h: Num }
  | { type: "revolve"; points: [Num, Num][]; angle?: Num; segments?: number }
  | { type: "hull"; children: Node[] }
  | { type: "union"; children: Node[] }
  | { type: "subtract"; children: Node[] }
  | { type: "intersect"; children: Node[] }
  | { type: "translate"; by: Vec3N; child: Node }
  | { type: "rotate"; by: Vec3N; child: Node }
  | { type: "mirror"; axis: "x" | "y" | "z"; child: Node }
  | { type: "array"; count: Num; step: Vec3N; child: Node };

export type NodeType = Node["type"];

export const NODE_TYPES: NodeType[] = [
  "box", "cylinder", "tube", "sphere", "cone", "torus", "extrude", "revolve",
  "hull", "union", "subtract", "intersect", "translate", "rotate", "mirror", "array",
];

export type Unit = "mm" | "deg" | "count";

export interface Param {
  value: number;
  min: number;
  max: number;
  unit: Unit;
  /** researched: backed by a fact (factId); estimated: the AI's or the owner's call. */
  source: "researched" | "estimated";
  factId?: string;
  note?: string;
}

export type Finish = "matte" | "satin" | "gloss" | "metal" | "clear";

export interface Part {
  id: string;
  name: string;
  purpose: string;
  attachesTo: string[];
  material: string;
  color: string;
  finish: Finish;
  visible: boolean;
  /** Where the part sits in the assembly, mm. */
  position: Vec3;
  /** Degrees about x, y, z. */
  rotation: Vec3;
  params: Record<string, Param>;
  shape: Node;
  /** A TRELLIS mesh shown instead of the exact shape, when switched on. */
  realistic?: { meshId: string; on: boolean };
}

export interface Fact {
  id: string;
  text: string;
  url: string;
  title: string;
}

export interface Project {
  v: 1;
  id: string;
  name: string;
  description: string;
  /** Everything the owner pasted in: brainstorms, plans, constraints. */
  brief: string;
  parts: Part[];
  research: Fact[];
  createdAt: number;
  updatedAt: number;
  /** True while a share link is live (see lib/store/projects.ts). */
  shared?: boolean;
}

export const LIMITS = { parts: 60, nodes: 200, brief: 60000, points: 400, arrayCount: 200, size: 5000 } as const;
