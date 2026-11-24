// File formats, written by hand so they work the same in the browser and in
// tests. Input is built parts in the recipe's frame: millimetres, Z up, each
// with its assembly position and rotation (degrees, three.js XYZ order).
// STL, OBJ, PLY and 3MF stay in millimetres with Z up, which is what slicers
// expect. GLB follows glTF: metres, Y up.
import { zipSync, strToU8 } from "fflate";
import { Euler, Matrix4, Vector3 } from "three";
import type { MeshData } from "@/lib/geometry/build";
import type { Finish, Vec3 } from "@/lib/recipe/types";

export interface ExportItem {
  id: string;
  name: string;
  color: string;
  finish: Finish;
  material: string;
  mesh: MeshData;
  position: Vec3;
  rotation: Vec3;
}

const DEG = Math.PI / 180;

/** A part's place in the assembly as a matrix (the viewer uses the same). */
export function partMatrix(position: Vec3, rotation: Vec3): Matrix4 {
  const m = new Matrix4().makeRotationFromEuler(new Euler(rotation[0] * DEG, rotation[1] * DEG, rotation[2] * DEG, "XYZ"));
  return m.setPosition(position[0], position[1], position[2]);
}

// Positions with the part's transform baked in.
function baked(item: ExportItem): Float32Array {
  const m = partMatrix(item.position, item.rotation);
  const src = item.mesh.positions;
  const out = new Float32Array(src.length);
  const v = new Vector3();
  for (let i = 0; i < src.length; i += 3) {
    v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(m);
    out[i] = v.x; out[i + 1] = v.y; out[i + 2] = v.z;
  }
  return out;
}

const rgb = (hex: string): [number, number, number] => {
  const h = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "888888";
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};
const safeName = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(0, 60) || "part";
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Binary STL, all items in one file. */
export function toSTL(items: ExportItem[]): ArrayBuffer {
  const tris = items.reduce((n, it) => n + it.mesh.indices.length / 3, 0);
  const buf = new ArrayBuffer(84 + 50 * tris);
  const dv = new DataView(buf);
  const head = "Cryptic Parts STL, millimetres";
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
  dv.setUint32(80, tris, true);
  let o = 84;
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), n = new Vector3();
  for (const it of items) {
    const p = baked(it), idx = it.mesh.indices;
    for (let t = 0; t < idx.length; t += 3) {
      a.fromArray(p, idx[t] * 3); b.fromArray(p, idx[t + 1] * 3); c.fromArray(p, idx[t + 2] * 3);
      n.subVectors(c, b).cross(new Vector3().subVectors(a, b)).normalize();
      for (const v of [n, a, b, c]) { dv.setFloat32(o, v.x, true); dv.setFloat32(o + 4, v.y, true); dv.setFloat32(o + 8, v.z, true); o += 12; }
      dv.setUint16(o, 0, true); o += 2;
    }
  }
  return buf;
}

/** Wavefront OBJ with a material file for the colors. */
export function toOBJ(items: ExportItem[], fileBase = "parts"): { obj: string; mtl: string } {
  const lines = [`# Cryptic Parts, millimetres, Z up`, `mtllib ${fileBase}.mtl`];
  const mtl: string[] = ["# Cryptic Parts materials"];
  let base = 1;
  items.forEach((it, k) => {
    const mat = `m${k}_${safeName(it.name)}`;
    const [r, g, b] = rgb(it.color);
    mtl.push(`newmtl ${mat}`, `Kd ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`, `Ka 0 0 0`, `Ns ${it.finish === "gloss" ? 200 : it.finish === "metal" ? 300 : 20}`, it.finish === "clear" ? "d 0.4" : "d 1", "");
    lines.push(`o ${safeName(it.name)}`, `usemtl ${mat}`);
    const p = baked(it);
    for (let i = 0; i < p.length; i += 3) lines.push(`v ${+p[i].toFixed(4)} ${+p[i + 1].toFixed(4)} ${+p[i + 2].toFixed(4)}`);
    const idx = it.mesh.indices;
    for (let t = 0; t < idx.length; t += 3) lines.push(`f ${idx[t] + base} ${idx[t + 1] + base} ${idx[t + 2] + base}`);
    base += p.length / 3;
  });
  return { obj: lines.join("\n") + "\n", mtl: mtl.join("\n") };
}

/** Binary PLY with per vertex colors. */
export function toPLY(items: ExportItem[]): ArrayBuffer {
  const verts = items.reduce((n, it) => n + it.mesh.positions.length / 3, 0);
  const faces = items.reduce((n, it) => n + it.mesh.indices.length / 3, 0);
  const header = strToU8(
    `ply\nformat binary_little_endian 1.0\ncomment Cryptic Parts, millimetres, Z up\nelement vertex ${verts}\nproperty float x\nproperty float y\nproperty float z\n` +
    `property uchar red\nproperty uchar green\nproperty uchar blue\nelement face ${faces}\nproperty list uchar uint vertex_indices\nend_header\n`);
  const buf = new ArrayBuffer(header.length + verts * 15 + faces * 13);
  new Uint8Array(buf).set(header);
  const dv = new DataView(buf);
  let o = header.length;
  for (const it of items) {
    const p = baked(it);
    const [r, g, b] = rgb(it.color).map((x) => Math.round(x * 255));
    for (let i = 0; i < p.length; i += 3) {
      dv.setFloat32(o, p[i], true); dv.setFloat32(o + 4, p[i + 1], true); dv.setFloat32(o + 8, p[i + 2], true);
      dv.setUint8(o + 12, r); dv.setUint8(o + 13, g); dv.setUint8(o + 14, b); o += 15;
    }
  }
  let base = 0;
  for (const it of items) {
    const idx = it.mesh.indices;
    for (let t = 0; t < idx.length; t += 3) {
      dv.setUint8(o, 3); dv.setUint32(o + 1, idx[t] + base, true); dv.setUint32(o + 5, idx[t + 1] + base, true); dv.setUint32(o + 9, idx[t + 2] + base, true); o += 13;
    }
    base += it.mesh.positions.length / 3;
  }
  return buf;
}

/** Binary glTF: one node, mesh and material per part. Metres, Y up. */
export function toGLB(items: ExportItem[]): ArrayBuffer {
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const bufferViews: object[] = [], accessors: object[] = [], meshes: object[] = [], nodes: object[] = [], materials: object[] = [];
  const add = (bytes: Uint8Array, target: number) => {
    const pad = (4 - (bytes.byteLength % 4)) % 4;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, target });
    chunks.push(bytes, new Uint8Array(pad));
    offset += bytes.byteLength + pad;
    return bufferViews.length - 1;
  };
  items.forEach((it, k) => {
    const p = baked(it);
    const pos = new Float32Array(p.length);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i += 3) {
      // mm Z up → m Y up
      const v = [p[i] / 1000, p[i + 2] / 1000, -p[i + 1] / 1000];
      for (let j = 0; j < 3; j++) { pos[i + j] = v[j]; if (v[j] < min[j]) min[j] = v[j]; if (v[j] > max[j]) max[j] = v[j]; }
    }
    const pv = add(new Uint8Array(pos.buffer), 34962);
    const iv = add(new Uint8Array(new Uint32Array(it.mesh.indices).buffer), 34963);
    accessors.push({ bufferView: pv, componentType: 5126, count: pos.length / 3, type: "VEC3", min, max });
    accessors.push({ bufferView: iv, componentType: 5125, count: it.mesh.indices.length, type: "SCALAR" });
    const [r, g, b] = rgb(it.color);
    materials.push({
      name: it.name,
      pbrMetallicRoughness: { baseColorFactor: [r, g, b, it.finish === "clear" ? 0.4 : 1], metallicFactor: it.finish === "metal" ? 0.9 : 0, roughnessFactor: it.finish === "gloss" ? 0.15 : it.finish === "satin" ? 0.4 : it.finish === "metal" ? 0.3 : 0.75 },
      ...(it.finish === "clear" ? { alphaMode: "BLEND" } : {}),
    });
    meshes.push({ name: it.name, primitives: [{ attributes: { POSITION: k * 2 }, indices: k * 2 + 1, material: k }] });
    nodes.push({ name: it.name, mesh: k });
  });
  const gltf = {
    asset: { version: "2.0", generator: "Cryptic Parts" },
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials, accessors, bufferViews,
    buffers: [{ byteLength: offset }],
  };
  let json = strToU8(JSON.stringify(gltf));
  const jpad = (4 - (json.byteLength % 4)) % 4;
  if (jpad) { const j = new Uint8Array(json.byteLength + jpad).fill(0x20); j.set(json); json = j; }
  const total = 12 + 8 + json.byteLength + 8 + offset;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, json.byteLength, true); dv.setUint32(16, 0x4e4f534a, true); out.set(json, 20);
  let o = 20 + json.byteLength;
  dv.setUint32(o, offset, true); dv.setUint32(o + 4, 0x004e4942, true); o += 8;
  for (const c of chunks) { out.set(c, o); o += c.byteLength; }
  return out.buffer;
}

/** 3MF: the format printer software prefers. One object per part, with its color. */
export function to3MF(items: ExportItem[]): Uint8Array {
  const colors = items.map((it) => it.color.toUpperCase().replace(/^#?/, "#") + "FF");
  const objects = items.map((it, k) => {
    const p = baked(it), idx = it.mesh.indices;
    const v: string[] = [], t: string[] = [];
    for (let i = 0; i < p.length; i += 3) v.push(`<vertex x="${+p[i].toFixed(4)}" y="${+p[i + 1].toFixed(4)}" z="${+p[i + 2].toFixed(4)}"/>`);
    for (let i = 0; i < idx.length; i += 3) t.push(`<triangle v1="${idx[i]}" v2="${idx[i + 1]}" v3="${idx[i + 2]}"/>`);
    return `<object id="${k + 2}" name="${xml(it.name)}" type="model" pid="1" pindex="${k}"><mesh><vertices>${v.join("")}</vertices><triangles>${t.join("")}</triangles></mesh></object>`;
  });
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Application">Cryptic Parts</metadata>
<resources><basematerials id="1">${items.map((it, k) => `<base name="${xml(it.material || it.name)}" displaycolor="${colors[k].slice(0, 7)}"/>`).join("")}</basematerials>${objects.join("")}</resources>
<build>${items.map((_, k) => `<item objectid="${k + 2}"/>`).join("")}</build>
</model>`;
  return zipSync({
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`),
    "3D/3dmodel.model": strToU8(model),
  });
}
