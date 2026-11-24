import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { toSTL, toOBJ, toPLY, toGLB, to3MF, type ExportItem } from "@/lib/export/formats";
import { specRows, specCSV } from "@/lib/export/spec";
import { tiny } from "./validate.test";

// A unit cube's 12 triangles, as built geometry would hand them over.
const cube = (): ExportItem["mesh"] => {
  const p = [0,0,0, 1,0,0, 1,1,0, 0,1,0, 0,0,1, 1,0,1, 1,1,1, 0,1,1];
  const t = [0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7];
  return { positions: new Float32Array(p), indices: new Uint32Array(t) };
};
const items = (): ExportItem[] => [
  { id: "a", name: "Frame front", color: "#112233", finish: "matte", material: "PLA", mesh: cube(), position: [0, 0, 0], rotation: [0, 0, 0] },
  { id: "b", name: "Temple arm", color: "#ff8800", finish: "gloss", material: "PETG", mesh: cube(), position: [10, 0, 0], rotation: [0, 0, 90] },
];

describe("exports", () => {
  it("binary STL: 80 byte header, a count, 50 bytes per triangle", () => {
    const buf = toSTL(items());
    expect(buf.byteLength).toBe(84 + 50 * 24);
    expect(new DataView(buf).getUint32(80, true)).toBe(24);
  });
  it("STL applies each part's position", () => {
    const dv = new DataView(toSTL([items()[0], { ...items()[0], position: [100, 0, 0] }]));
    const firstX = (tri: number) => dv.getFloat32(84 + tri * 50 + 12, true);
    expect(firstX(12)).toBeGreaterThanOrEqual(100);
  });
  it("OBJ has an object and a material per part", () => {
    const { obj, mtl } = toOBJ(items(), "glasses");
    expect(obj.match(/^o /gm)?.length).toBe(2);
    expect(obj.match(/^f /gm)?.length).toBe(24);
    expect(mtl).toContain("Kd 0.0667 0.1333 0.2000");
    expect(obj).toContain("mtllib glasses.mtl");
  });
  it("PLY header counts match", () => {
    const text = new TextDecoder().decode(new Uint8Array(toPLY(items())).slice(0, 300));
    expect(text).toContain("element vertex 16");
    expect(text).toContain("element face 24");
  });
  it("GLB is a valid container with one mesh per part, sized in metres", () => {
    const glb = toGLB(items());
    const dv = new DataView(glb);
    expect(dv.getUint32(0, true)).toBe(0x46546c67);   // "glTF"
    expect(dv.getUint32(8, true)).toBe(glb.byteLength);
    const jsonLen = dv.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, jsonLen)));
    expect(json.meshes.length).toBe(2);
    expect(json.materials[1].pbrMetallicRoughness.baseColorFactor[0]).toBeCloseTo(1, 3);
    expect(json.accessors[0].max[0]).toBeCloseTo(0.001, 6);
  });
  it("3MF zip has the model with an object and color per part", () => {
    const files = unzipSync(to3MF(items()));
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["[Content_Types].xml", "_rels/.rels", "3D/3dmodel.model"]));
    const xml = strFromU8(files["3D/3dmodel.model"]);
    expect(xml.match(/<object /g)?.length).toBe(2);
    expect(xml).toContain('unit="millimeter"');
    expect(xml).toContain("#FF8800");
    expect(xml).toContain('name="Temple arm"');
  });
  it("spec rows and CSV: one line per part with size and weight", () => {
    const p = tiny();
    const rows = specRows(p, { arm: { bbox: { min: [-70, -1.5, -4], max: [70, 1.5, 4] }, volume: 3360 } });
    expect(rows[0].size).toEqual([140, 3, 8]);
    expect(rows[0].grams).toBeCloseTo(4.1664, 3);
    const csv = specCSV(rows);
    expect(csv.split("\n")[0]).toBe("Part,Width mm,Depth mm,Height mm,Volume cm3,Weight g,Material,Color,Finish,Purpose,Sizes");
    expect(csv.split("\n")).toHaveLength(2);
  });
});
