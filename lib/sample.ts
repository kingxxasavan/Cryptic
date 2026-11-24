// A ready made project to open without the AI: a pair of smart glasses with a
// camera in the bridge and a battery pod in each arm (the Cryptic glasses).
// Every size is marked estimated: these are typical adult sizes, not research.
// Z is up, the glasses face -Y, the arms run back along +Y.
import type { Node, Param, Part, Project } from "@/lib/recipe/types";

const mm = (value: number, min: number, max: number, note?: string): Param => ({ value, min, max, unit: "mm", source: "estimated", ...(note ? { note } : {}) });
const alongY = (child: Node): Node => ({ type: "rotate", by: [90, 0, 0], child });
const at = (x: number | string, y: number | string, z: number | string, child: Node): Node => ({ type: "translate", by: [x, y, z], child });

function part(p: Partial<Part> & Pick<Part, "id" | "name" | "shape">): Part {
  return { purpose: "", attachesTo: [], material: "PLA", color: "#2a2a30", finish: "matte", visible: true, position: [0, 0, 0], rotation: [0, 0, 0], params: {}, ...p };
}

/** An oval hole or lens: the hull of two cylinders running along Y. */
const oval = (w: string, h: string, t: string): Node => ({ type: "hull", children: [
  at(`-(${w} - ${h}) / 2`, 0, 0, alongY({ type: "cylinder", d: h, h: t, segments: 64 })),
  at(`(${w} - ${h}) / 2`, 0, 0, alongY({ type: "cylinder", d: h, h: t, segments: 64 })),
] });

function lens(id: string, name: string, x: number): Part {
  return part({
    id, name, purpose: "Clear lens held in the frame", attachesTo: ["frame_front"], material: "Polycarbonate", color: "#a9d4ff", finish: "clear",
    position: [x, 0, 0],
    params: { lens_w: mm(51.6, 40, 60, "slightly smaller than the frame opening"), lens_h: mm(37.6, 28, 46), thick: mm(2, 1.2, 3) },
    shape: oval("lens_w", "lens_h", "thick"),
  });
}

function hinge(id: string, name: string, x: number): Part {
  return part({
    id, name, purpose: "Barrel hinge that lets the arm fold", attachesTo: ["frame_front", id.replace("hinge", "temple")], material: "Stainless steel", color: "#b8bcc4", finish: "metal",
    position: [x, 6.5, 11],
    params: { w: mm(5, 3, 8), d: mm(8, 5, 12), h: mm(6, 4, 10), pin: mm(1.5, 1, 2.5, "clearance for an M1.4 hinge screw") },
    shape: { type: "subtract", children: [{ type: "box", w: "w", d: "d", h: "h" }, { type: "cylinder", d: "pin", h: "h + 1", segments: 24 }] },
  });
}

function temple(id: string, name: string, x: number): Part {
  const bar = (y: string, z: string): Node => at(0, y, z, { type: "box", w: "thick", d: 1, h: "height" });
  return part({
    id, name, purpose: "Arm that runs back over the ear", attachesTo: [id.replace("temple", "hinge"), id.replace("temple", "battery")], material: "PLA", color: "#2a2a30",
    position: [x, 10, 11],
    params: { length: mm(145, 120, 160, "typical adult temple length is 135 to 150"), straight: mm(112, 80, 140, "where the ear bend starts"), height: mm(6, 4, 10), thick: mm(3.5, 2.4, 6), drop: mm(20, 8, 35, "how far the tip bends down") },
    shape: { type: "union", children: [
      { type: "hull", children: [bar("0", "0"), bar("straight", "0")] },
      { type: "hull", children: [bar("straight", "0"), bar("length", "-drop")] },
    ] },
  });
}

function battery(id: string, name: string, x: number): Part {
  return part({
    id, name, purpose: "Holds a small Li-ion cell; screws onto the arm", attachesTo: [id.replace("battery", "temple")], material: "PETG", color: "#3b3b46", finish: "satin",
    position: [x, 48, 11],
    params: { w: mm(8, 6, 12), d: mm(32, 20, 45), h: mm(10, 7, 14), wall: mm(1.2, 0.8, 2), round: mm(3, 1, 4) },
    shape: { type: "subtract", children: [
      { type: "hull", children: [
        at(0, "-(d / 2 - round)", 0, { type: "box", w: "w", d: "round * 2", h: "h" }),
        at(0, "d / 2 - round", 0, alongY({ type: "cylinder", d: "h", h: 1 })),
      ] },
      at(0, 0, "wall", { type: "box", w: "w - 2 * wall", d: "d - 4 * wall", h: "h" }),
    ] },
  });
}

function nosePad(id: string, name: string, x: number): Part {
  return part({
    id, name, purpose: "Soft pad that rests on the nose", attachesTo: ["frame_front"], material: "Silicone", color: "#e9e4dc", finish: "satin",
    position: [x, 6, -7],
    params: { len: mm(13, 8, 18), size: mm(7, 4, 10) },
    shape: { type: "hull", children: [at(0, 0, "len / 2", { type: "sphere", d: "size", segments: 24 }), at(0, 0, "-len / 2", { type: "sphere", d: "size * 0.8", segments: 24 })] },
  });
}

export function sampleGlasses(id: string): Project {
  const now = Date.now();
  const frame = part({
    id: "frame_front", name: "Frame front", purpose: "Holds the lenses, the camera and the hinges", attachesTo: [], material: "PLA", color: "#1c1c22",
    params: {
      width: mm(140, 120, 155, "typical adult frame width"), height: mm(44, 34, 56), thick: mm(5, 3, 8), corner: mm(10, 4, 18),
      lens_w: mm(52, 40, 60), lens_h: mm(38, 28, 46), bridge: mm(18, 14, 24, "typical bridge width is 16 to 20"),
    },
    shape: { type: "subtract", children: [
      { type: "hull", children: [
        at("-(width / 2 - corner)", 0, "height / 2 - corner", alongY({ type: "cylinder", d: "corner * 2", h: "thick" })),
        at("width / 2 - corner", 0, "height / 2 - corner", alongY({ type: "cylinder", d: "corner * 2", h: "thick" })),
        at("-(width / 2 - corner)", 0, "-(height / 2 - corner)", alongY({ type: "cylinder", d: "corner * 2", h: "thick" })),
        at("width / 2 - corner", 0, "-(height / 2 - corner)", alongY({ type: "cylinder", d: "corner * 2", h: "thick" })),
      ] },
      at("-(bridge / 2 + lens_w / 2)", 0, 0, oval("lens_w", "lens_h", "thick + 2")),
      at("bridge / 2 + lens_w / 2", 0, 0, oval("lens_w", "lens_h", "thick + 2")),
      at(0, "-thick / 2", "height / 2 - 9", alongY({ type: "cylinder", d: 6, h: 4 })),
    ] },
  });
  const camera = part({
    id: "camera_housing", name: "Camera housing", purpose: "Holds the camera module behind the bridge", attachesTo: ["frame_front"], material: "PETG", color: "#2f2f38", finish: "satin",
    position: [0, 5, 13],
    params: { w: mm(14, 10, 20), d: mm(7, 5, 10), h: mm(10, 7, 14), lens_hole: mm(5, 3, 8) },
    shape: { type: "subtract", children: [{ type: "box", w: "w", d: "d", h: "h" }, alongY({ type: "cylinder", d: "lens_hole", h: "d + 1" })] },
  });
  const camLens = part({
    id: "camera_lens", name: "Camera lens", purpose: "Cover glass in front of the camera", attachesTo: ["frame_front", "camera_housing"], material: "Glass", color: "#0b1020", finish: "gloss",
    position: [0, -2.4, 13],
    params: { d: mm(5.6, 3, 9), thick: mm(1.2, 0.5, 2) },
    shape: alongY({ type: "cylinder", d: "d", h: "thick" }),
  });
  return {
    v: 1, id, name: "Cryptic smart glasses (sample)",
    description: "Smart glasses with a camera in the bridge and a battery pod in each arm.",
    brief: "Sample project. The frame holds two lenses and a small camera above the bridge. Each arm carries a battery pod. Hinges are stainless barrels with M1.4 screws. Every size is a typical adult size and marked estimated; ask the AI to research and refine them.",
    research: [],
    parts: [frame, lens("lens_left", "Left lens", -35), lens("lens_right", "Right lens", 35), camera, camLens,
      hinge("hinge_left", "Left hinge", -67.5), hinge("hinge_right", "Right hinge", 67.5),
      temple("temple_left", "Left arm", -68), temple("temple_right", "Right arm", 68),
      battery("battery_left", "Left battery pod", -72.5), battery("battery_right", "Right battery pod", 72.5),
      nosePad("nose_pad_left", "Left nose pad", -11), nosePad("nose_pad_right", "Right nose pad", 11)],
    createdAt: now, updatedAt: now,
  };
}
