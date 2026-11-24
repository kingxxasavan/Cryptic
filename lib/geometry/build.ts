// Recipe → solid. Runs wherever manifold-3d's WASM is loaded: the browser's
// geometry worker, and node for tests. Every manifold made along the way is
// freed, since WASM memory isn't garbage collected.
//
// Conventions (also what the AI is told): millimetres, Z is up. Boxes,
// spheres and cylinders are centred on the origin; cylinders, tubes and cones
// run along Z. extrude takes an XY polygon up Z, centred on Z. revolve spins
// an (r, z) profile around Z. Angles are degrees.
import type { ManifoldToplevel, Manifold as M } from "manifold-3d/manifold";
import type { Node, Num, Part } from "@/lib/recipe/types";
import { LIMITS } from "@/lib/recipe/types";
import { evalExpr } from "@/lib/recipe/expr";
import { paramValues } from "@/lib/recipe/validate";

export type Wasm = ManifoldToplevel;
export interface MeshData { positions: Float32Array; indices: Uint32Array }
export interface Box3 { min: [number, number, number]; max: [number, number, number] }
export type Built = { mesh: MeshData; bbox: Box3; volume: number } | { error: string };

class BuildError extends Error {}

const SEG = 48;

export function buildPart(wasm: Wasm, part: Part): Built {
  const made: M[] = [];
  const keep = <T extends M>(m: T): T => { made.push(m); return m; };
  const params = paramValues(part);
  const { Manifold, CrossSection } = wasm;

  const n = (v: Num, what: string): number => {
    try { return evalExpr(v, params); }
    catch (e) { throw new BuildError(`${what}: ${(e as Error).message}`); }
  };
  const pos = (v: Num, what: string): number => {
    const x = n(v, what);
    if (!(x > 0)) throw new BuildError(`${what} must be more than 0 (it's ${typeof v === "string" ? v + " = " : ""}${x})`);
    if (x > LIMITS.size) throw new BuildError(`${what} is bigger than ${LIMITS.size} mm`);
    return x;
  };
  const segs = (s: number | undefined) => Math.max(8, Math.min(256, Math.round(s || SEG)));
  const poly = (pts: [Num, Num][], what: string) => pts.map(([x, y], i) => [n(x, `${what} point ${i + 1}`), n(y, `${what} point ${i + 1}`)] as [number, number]);

  const build = (node: Node, depth: number): M => {
    if (depth > 40) throw new BuildError("shapes are nested too deep");
    switch (node.type) {
      case "box": return keep(Manifold.cube([pos(node.w, "box w"), pos(node.d, "box d"), pos(node.h, "box h")], true));
      case "cylinder": { const r = pos(node.d, "cylinder d") / 2; return keep(Manifold.cylinder(pos(node.h, "cylinder h"), r, r, segs(node.segments), true)); }
      case "cone": {
        const d1 = n(node.d1, "cone d1"), d2 = n(node.d2, "cone d2");
        if (d1 < 0 || d2 < 0 || (d1 === 0 && d2 === 0)) throw new BuildError("cone needs d1 or d2 more than 0");
        return keep(Manifold.cylinder(pos(node.h, "cone h"), d1 / 2, d2 / 2, segs(node.segments), true));
      }
      case "tube": {
        const od = pos(node.od, "tube od"), id = pos(node.id, "tube id"), h = pos(node.h, "tube h");
        if (id >= od) throw new BuildError(`tube id (${id}) must be smaller than od (${od})`);
        const outer = keep(Manifold.cylinder(h, od / 2, od / 2, segs(node.segments), true));
        const inner = keep(Manifold.cylinder(h + 0.02, id / 2, id / 2, segs(node.segments), true));
        return keep(outer.subtract(inner));
      }
      case "sphere": return keep(Manifold.sphere(pos(node.d, "sphere d") / 2, segs(node.segments)));
      case "torus": {
        const D = pos(node.D, "torus D"), d = pos(node.d, "torus d");
        if (d >= D) throw new BuildError("torus d must be smaller than D");
        const ring = CrossSection.circle(d / 2, segs(node.segments) / 2).translate([D / 2, 0]);
        const m = keep(Manifold.revolve(ring, segs(node.segments)));
        ring.delete();
        return m;
      }
      case "extrude": {
        const cs = CrossSection.ofPolygons([poly(node.points, "extrude")], "Positive");
        if (cs.isEmpty()) { cs.delete(); throw new BuildError("extrude outline has no area (check the points' order and that they don't cross)"); }
        const m = keep(Manifold.extrude(cs, pos(node.h, "extrude h"), 0, 0, [1, 1], true));
        cs.delete();
        return m;
      }
      case "revolve": {
        const cs = CrossSection.ofPolygons([poly(node.points, "revolve")], "Positive");
        if (cs.isEmpty()) { cs.delete(); throw new BuildError("revolve profile has no area"); }
        const angle = node.angle === undefined ? 360 : n(node.angle, "revolve angle");
        // manifold revolves around Y and lays the result along Z, which is
        // exactly "profile in (r, z), spun about Z".
        const m = keep(Manifold.revolve(cs, segs(node.segments), Math.max(1, Math.min(360, angle))));
        cs.delete();
        return m;
      }
      case "hull": return keep(Manifold.hull(node.children.map(c => build(c, depth + 1))));
      case "union": return keep(Manifold.union(node.children.map(c => build(c, depth + 1))));
      case "intersect": return keep(Manifold.intersection(node.children.map(c => build(c, depth + 1))));
      case "subtract": {
        const [first, ...rest] = node.children.map(c => build(c, depth + 1));
        return keep(Manifold.difference([first, ...rest]));
      }
      case "translate": return keep(build(node.child, depth + 1).translate([n(node.by[0], "translate x"), n(node.by[1], "translate y"), n(node.by[2], "translate z")]));
      case "rotate": return keep(build(node.child, depth + 1).rotate([n(node.by[0], "rotate x"), n(node.by[1], "rotate y"), n(node.by[2], "rotate z")]));
      case "mirror": {
        const normal: [number, number, number] = node.axis === "x" ? [1, 0, 0] : node.axis === "y" ? [0, 1, 0] : [0, 0, 1];
        return keep(build(node.child, depth + 1).mirror(normal));
      }
      case "array": {
        const count = Math.round(n(node.count, "array count"));
        if (count < 1 || count > LIMITS.arrayCount) throw new BuildError(`array count must be 1 to ${LIMITS.arrayCount}`);
        const step = [n(node.step[0], "array step x"), n(node.step[1], "array step y"), n(node.step[2], "array step z")];
        const base = build(node.child, depth + 1);
        const copies = Array.from({ length: count }, (_, i) => keep(base.translate([step[0] * i, step[1] * i, step[2] * i])));
        return keep(Manifold.union(copies));
      }
      default: throw new BuildError(`unknown shape "${(node as { type: string }).type}"`);
    }
  };

  try {
    const solid = build(part.shape, 0);
    const status = solid.status();
    if (status !== "NoError") throw new BuildError(`the shape isn't a clean solid (${status})`);
    if (solid.isEmpty()) throw new BuildError("the shape came out empty (a cut may remove everything)");
    const mesh = solid.getMesh();
    const np = mesh.numProp;
    const positions = new Float32Array(mesh.numVert * 3);
    for (let i = 0; i < mesh.numVert; i++) {
      positions[i * 3] = mesh.vertProperties[i * np];
      positions[i * 3 + 1] = mesh.vertProperties[i * np + 1];
      positions[i * 3 + 2] = mesh.vertProperties[i * np + 2];
    }
    const box = solid.boundingBox();
    return {
      mesh: { positions, indices: new Uint32Array(mesh.triVerts) },
      bbox: { min: [box.min[0], box.min[1], box.min[2]], max: [box.max[0], box.max[1], box.max[2]] },
      volume: solid.volume(),
    };
  } catch (e) {
    return { error: e instanceof BuildError ? e.message : "couldn't build this shape: " + ((e as Error)?.message || String(e)) };
  } finally {
    for (const m of made) { try { m.delete(); } catch { /* already freed */ } }
  }
}
