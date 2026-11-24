// Sizes and weights for the spec sheet. Densities in g/cm³ for common
// printing and building materials; a material not listed gets no weight
// rather than a guess.
import type { Box3 } from "./build";

export interface MaterialInfo { name: string; density: number; kind: "print" | "metal" | "other"; note: string }

export const MATERIALS: MaterialInfo[] = [
  { name: "PLA", density: 1.24, kind: "print", note: "Easy to print, stiff, softens around 55 °C." },
  { name: "PETG", density: 1.27, kind: "print", note: "Tougher than PLA, handles more heat, a little flexible." },
  { name: "ABS", density: 1.04, kind: "print", note: "Heat resistant and tough; needs an enclosure to print well." },
  { name: "ASA", density: 1.07, kind: "print", note: "Like ABS but holds up outdoors in sunlight." },
  { name: "TPU", density: 1.21, kind: "print", note: "Rubbery and flexible: pads, grips, bumpers." },
  { name: "Nylon", density: 1.14, kind: "print", note: "Strong and slippery; good for hinges and gears." },
  { name: "Resin", density: 1.15, kind: "print", note: "Fine detail from an SLA printer; can be brittle." },
  { name: "Polycarbonate", density: 1.2, kind: "other", note: "Very tough and clear; used for lenses and shields." },
  { name: "Acrylic", density: 1.18, kind: "other", note: "Clear and stiff; scratches more than polycarbonate." },
  { name: "Silicone", density: 1.1, kind: "other", note: "Soft and skin friendly: nose pads, seals." },
  { name: "Aluminium", density: 2.7, kind: "metal", note: "Light metal; machined or bent sheet." },
  { name: "Stainless steel", density: 8.0, kind: "metal", note: "Screws, springs and hinge pins." },
  { name: "Steel", density: 7.85, kind: "metal", note: "Strong, heavy, rusts unless coated." },
  { name: "Titanium", density: 4.5, kind: "metal", note: "Light and strong; premium frames." },
  { name: "Brass", density: 8.5, kind: "metal", note: "Threaded inserts and small fittings." },
  { name: "Copper", density: 8.96, kind: "metal", note: "Contacts and heat spreaders." },
  { name: "Glass", density: 2.5, kind: "other", note: "Lenses and covers." },
  { name: "Wood", density: 0.6, kind: "other", note: "Varies a lot by species." },
  { name: "PCB (FR4)", density: 1.85, kind: "other", note: "Circuit boards." },
  { name: "Li-ion cell", density: 2.4, kind: "other", note: "Average for a battery cell." },
];

const ALIASES: Record<string, string> = { aluminum: "Aluminium", "stainless": "Stainless steel", fr4: "PCB (FR4)", pcb: "PCB (FR4)", battery: "Li-ion cell", lipo: "Li-ion cell", "li-po": "Li-ion cell" };

export function densityOf(material: string): number | null {
  const key = String(material || "").trim().toLowerCase();
  const name = ALIASES[key] || material;
  const hit = MATERIALS.find(m => m.name.toLowerCase() === String(name).trim().toLowerCase());
  return hit ? hit.density : null;
}

/** Volume in mm³ → grams. */
export function weightGrams(volumeMm3: number, material: string): number | null {
  const d = densityOf(material);
  return d === null ? null : (volumeMm3 / 1000) * d;
}

/** Width (x) × depth (y) × height (z), mm. */
export function sizeOf(b: Box3): [number, number, number] {
  return [0, 1, 2].map(i => Math.round((b.max[i] - b.min[i]) * 1000) / 1000) as [number, number, number];
}
