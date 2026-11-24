"use client";
// Turning built parts into files the browser downloads.
import type { Project } from "@/lib/recipe/types";
import type { PartBuild } from "@/lib/geometry/client";
import { toGLB, toOBJ, toPLY, toSTL, to3MF, type ExportItem } from "@/lib/export/formats";
import { specCSV, specRows } from "@/lib/export/spec";
import { zipSync, strToU8 } from "fflate";

export type Format = "stl" | "3mf" | "obj" | "glb" | "ply";
export type Scope = "all" | "visible" | "selected";

export const FORMATS: { id: Format; label: string; note: string }[] = [
  { id: "3mf", label: "3MF", note: "Best for 3D printing; keeps every part and its color" },
  { id: "stl", label: "STL", note: "Works with every slicer; no colors" },
  { id: "obj", label: "OBJ", note: "With an MTL file for colors (zipped)" },
  { id: "glb", label: "GLB", note: "For viewers, games and AR; colors and finishes, in metres" },
  { id: "ply", label: "PLY", note: "Colored mesh for 3D tools" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "parts";

export function itemsFor(project: Project, builds: Record<string, PartBuild>, scope: Scope, selected: string | null): ExportItem[] {
  return project.parts
    .filter((p) => (scope === "all" ? true : scope === "visible" ? p.visible : p.id === selected))
    .filter((p) => builds[p.id]?.solid)
    .map((p) => ({ id: p.id, name: p.name, color: p.color, finish: p.finish, material: p.material, mesh: builds[p.id]!.solid!.mesh, position: p.position, rotation: p.rotation }));
}

export function save(name: string, data: ArrayBuffer | Uint8Array | string, type: string) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function download(project: Project, builds: Record<string, PartBuild>, format: Format, scope: Scope, selected: string | null): string | null {
  const items = itemsFor(project, builds, scope, selected);
  if (!items.length) return "Nothing to export yet: the parts are still being built, or none are picked.";
  const base = slug(scope === "selected" && items.length === 1 ? project.name + " " + items[0].name : project.name);
  if (format === "stl") save(base + ".stl", toSTL(items), "model/stl");
  if (format === "3mf") save(base + ".3mf", to3MF(items), "model/3mf");
  if (format === "glb") save(base + ".glb", toGLB(items), "model/gltf-binary");
  if (format === "ply") save(base + ".ply", toPLY(items), "application/octet-stream");
  if (format === "obj") { const { obj, mtl } = toOBJ(items, base); save(base + "-obj.zip", zipSync({ [base + ".obj"]: strToU8(obj), [base + ".mtl"]: strToU8(mtl) }), "application/zip"); }
  return null;
}

export function measuresOf(builds: Record<string, PartBuild>) {
  return Object.fromEntries(Object.entries(builds).map(([id, b]) => [id, b.solid ? { bbox: b.solid.bbox, volume: b.solid.volume } : undefined]));
}

export function downloadCSV(project: Project, builds: Record<string, PartBuild>) {
  save(slug(project.name) + "-spec.csv", specCSV(specRows(project, measuresOf(builds))), "text/csv");
}
