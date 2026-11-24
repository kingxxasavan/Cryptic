// The spec sheet: every part's size, volume, weight, material and color, as
// rows for the Specs tab, the printable sheet and the CSV download.
import type { Project } from "@/lib/recipe/types";
import type { Box3 } from "@/lib/geometry/build";
import { sizeOf, weightGrams } from "@/lib/geometry/measure";

export interface SpecRow {
  id: string;
  name: string;
  size: [number, number, number] | null;
  volumeCm3: number | null;
  grams: number | null;
  material: string;
  color: string;
  finish: string;
  purpose: string;
  sizes: string;
}

export function specRows(project: Project, measures: Record<string, { bbox: Box3; volume: number } | undefined>): SpecRow[] {
  return project.parts.map((p) => {
    const m = measures[p.id];
    return {
      id: p.id,
      name: p.name,
      size: m ? sizeOf(m.bbox) : null,
      volumeCm3: m ? m.volume / 1000 : null,
      grams: m ? weightGrams(m.volume, p.material) : null,
      material: p.material,
      color: p.color,
      finish: p.finish,
      purpose: p.purpose,
      sizes: Object.entries(p.params).map(([k, v]) => `${k} ${v.value}${v.unit === "mm" ? " mm" : v.unit === "deg" ? "°" : ""}${v.source === "researched" ? " (researched)" : ""}`).join("; "),
    };
  });
}

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const r2 = (n: number | null) => (n === null ? "" : String(Math.round(n * 100) / 100));

export function specCSV(rows: SpecRow[]): string {
  const head = ["Part", "Width mm", "Depth mm", "Height mm", "Volume cm3", "Weight g", "Material", "Color", "Finish", "Purpose", "Sizes"];
  return [head.join(","), ...rows.map((r) => [r.name, r.size?.[0] ?? "", r.size?.[1] ?? "", r.size?.[2] ?? "", r2(r.volumeCm3), r2(r.grams), r.material, r.color, r.finish, r.purpose, r.sizes].map(cell).join(","))].join("\n");
}
