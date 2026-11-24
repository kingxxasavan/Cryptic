"use client";
// The 3D view. Recipes are Z up (like printers and CAD); three.js is Y up, so
// everything sits in one group turned -90° about X.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Bounds, Edges, Float, Grid, OrbitControls, TransformControls, useBounds } from "@react-three/drei";
import { Box3, BufferAttribute, BufferGeometry, Euler, Group, MathUtils, Matrix4, type Object3D, Vector3 } from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Part, Vec3 } from "@/lib/recipe/types";
import type { PartBuild } from "@/lib/geometry/client";
import { loadMesh } from "@/lib/store/projects";

export interface SceneProps {
  parts: Part[];
  builds: Record<string, PartBuild>;
  selected: string | null;
  onSelect?: (id: string | null) => void;
  explode: number;
  float: boolean;
  gizmo?: "translate" | "rotate" | null;
  onMove?: (id: string, position: Vec3, rotation: Vec3) => void;
  fitKey?: number;
}

const FINISH: Record<string, { roughness: number; metalness: number; opacity?: number }> = {
  matte: { roughness: 0.8, metalness: 0 }, satin: { roughness: 0.45, metalness: 0.05 }, gloss: { roughness: 0.15, metalness: 0.05 },
  metal: { roughness: 0.28, metalness: 0.9 }, clear: { roughness: 0.05, metalness: 0, opacity: 0.35 },
};

function partCentre(p: Part, b?: PartBuild): Vector3 {
  const c = b?.solid ? new Vector3().fromArray(b.solid.bbox.min).add(new Vector3().fromArray(b.solid.bbox.max)).multiplyScalar(0.5) : new Vector3();
  const m = new Matrix4().makeRotationFromEuler(new Euler(...p.rotation.map((r) => r * MathUtils.DEG2RAD) as Vec3, "XYZ"));
  return c.applyMatrix4(m).add(new Vector3(...p.position));
}

/** How far each part moves out in the exploded view. */
export function explodeOffsets(parts: Part[], builds: Record<string, PartBuild>, k: number): Record<string, Vector3> {
  const vis = parts.filter((p) => p.visible);
  const centres = Object.fromEntries(vis.map((p) => [p.id, partCentre(p, builds[p.id])]));
  const mid = vis.reduce((a, p) => a.add(centres[p.id]), new Vector3()).multiplyScalar(1 / Math.max(1, vis.length));
  const span = Math.max(40, ...vis.map((p) => centres[p.id].distanceTo(mid)));
  return Object.fromEntries(vis.map((p) => {
    const dir = centres[p.id].clone().sub(mid);
    // Parts right at the middle still move: straight up.
    if (dir.length() < span * 0.05) dir.set(0, 0, span * 0.4);
    return [p.id, dir.multiplyScalar(k * 1.1)];
  }));
}

function geometryOf(b: PartBuild): BufferGeometry | null {
  if (!b.solid) return null;
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(b.solid.mesh.positions, 3));
  g.setIndex(new BufferAttribute(b.solid.mesh.indices, 1));
  const creased = toCreasedNormals(g, MathUtils.degToRad(35));
  g.dispose();
  return creased;
}

function Realistic({ meshId, bbox }: { meshId: string; bbox: { min: number[]; max: number[] } }) {
  const [obj, setObj] = useState<Object3D | null>(null);
  useEffect(() => {
    let live = true;
    loadMesh(meshId).then((u8) => {
      if (!u8 || !live) return;
      new GLTFLoader().parse(u8.slice().buffer, "", (gltf) => {
        if (!live) return;
        const scene = gltf.scene;
        scene.rotation.x = Math.PI / 2; // glTF is Y up
        scene.updateMatrixWorld(true);
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3()), want = new Vector3().fromArray(bbox.max).sub(new Vector3().fromArray(bbox.min));
        const s = Math.min(want.x / size.x, want.y / size.y, want.z / size.z);
        const wrap = new Group();
        wrap.add(scene);
        wrap.scale.setScalar(s);
        const centre = box.getCenter(new Vector3()).multiplyScalar(s);
        const target = new Vector3().fromArray(bbox.min).add(new Vector3().fromArray(bbox.max)).multiplyScalar(0.5);
        wrap.position.copy(target.sub(centre));
        setObj(wrap);
      }, () => {});
    });
    return () => { live = false; };
  }, [meshId, bbox.min, bbox.max]);
  return obj ? <primitive object={obj} /> : null;
}

function PartMesh({ part, build, selected, offset, onSelect, setRef }: { part: Part; build: PartBuild; selected: boolean; offset: Vector3; onSelect?: (id: string) => void; setRef?: (g: Group | null) => void }) {
  // Keyed on the solid, so a part's mesh is only rebuilt when its shape changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => geometryOf(build), [build.solid]);
  useEffect(() => () => geo?.dispose(), [geo]);
  const [hover, setHover] = useState(false);
  if (!geo) return null;
  const f = FINISH[part.finish] || FINISH.matte;
  const real = part.realistic?.on && build.solid;
  return (
    <group ref={setRef} position={[part.position[0] + offset.x, part.position[1] + offset.y, part.position[2] + offset.z]} rotation={part.rotation.map((r) => r * MathUtils.DEG2RAD) as Vec3}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect?.(part.id); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = onSelect ? "pointer" : ""; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
      {real ? <Realistic meshId={part.realistic!.meshId} bbox={build.solid!.bbox} /> : (
        <mesh geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color={part.color} roughness={f.roughness} metalness={f.metalness} transparent={f.opacity !== undefined} opacity={f.opacity ?? 1}
            emissive={selected ? "#5a4520" : hover ? "#26262e" : "#000000"} emissiveIntensity={selected ? 0.55 : 1} depthWrite={f.opacity === undefined} />
          {(selected || build.error) && <Edges threshold={25} color={build.error ? "#ff8a8a" : "#e6c78f"} />}
        </mesh>
      )}
    </group>
  );
}

function FitOnReady({ count, fitKey }: { count: number; fitKey?: number }) {
  const bounds = useBounds();
  const did = useRef(-1);
  useEffect(() => {
    if (!count) return;
    if (did.current === (fitKey ?? 0)) return;
    did.current = fitKey ?? 0;
    const t = setTimeout(() => bounds.refresh().clip().fit(), 60);
    return () => clearTimeout(t);
  }, [count, fitKey, bounds]);
  return null;
}

function Assembly(p: SceneProps) {
  const offsets = useMemo(() => explodeOffsets(p.parts, p.builds, p.explode), [p.parts, p.builds, p.explode]);
  const refs = useRef<Record<string, Group | null>>({});
  const [target, setTarget] = useState<Group | null>(null);
  const sel = p.selected ? p.parts.find((x) => x.id === p.selected) : undefined;
  useEffect(() => { setTarget(p.selected ? refs.current[p.selected] || null : null); }, [p.selected, p.builds]);
  const built = p.parts.filter((x) => p.builds[x.id]?.solid).length;
  const minZ = Math.min(0, ...p.parts.filter((x) => x.visible && p.builds[x.id]?.solid).map((x) => x.position[2] + p.builds[x.id]!.solid!.bbox.min[2] + (offsets[x.id]?.z || 0)));
  const content = (
    <group>
      {p.parts.filter((x) => x.visible && p.builds[x.id]).map((x) => (
        <PartMesh key={x.id} part={x} build={p.builds[x.id]} selected={x.id === p.selected} offset={offsets[x.id] || new Vector3()}
          onSelect={p.onSelect} setRef={(g) => { refs.current[x.id] = g; }} />
      ))}
    </group>
  );
  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Bounds margin={1.25}>
          <FitOnReady count={built} fitKey={p.fitKey} />
          {p.float && !p.gizmo ? <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-2, 2]}>{content}</Float> : content}
        </Bounds>
        {p.gizmo && target && sel && p.onMove && (
          <TransformControls object={target} mode={p.gizmo} size={0.8}
            onMouseUp={() => {
              const o = offsets[sel.id] || new Vector3();
              const pos: Vec3 = [round(target.position.x - o.x), round(target.position.y - o.y), round(target.position.z - o.z)];
              const rot = [target.rotation.x, target.rotation.y, target.rotation.z].map((r) => round(r * MathUtils.RAD2DEG)) as Vec3;
              p.onMove!(sel.id, pos, rot);
            }} />
        )}
      </group>
      <Grid position={[0, minZ - 0.5, 0]} args={[2000, 2000]} cellSize={10} cellThickness={0.6} sectionSize={50} sectionThickness={1} cellColor="#2a2a33" sectionColor="#3b3b48" fadeDistance={900} fadeStrength={1.5} infiniteGrid />
    </>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

export function Scene(props: SceneProps) {
  return (
    <Canvas camera={{ position: [160, 120, 220], fov: 38, near: 0.5, far: 8000 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}
      onPointerMissed={() => props.onSelect?.(null)} style={{ touchAction: "none" }}>
      <color attach="background" args={["#0b0b10"]} />
      <hemisphereLight args={["#e8eeff", "#1a1a20", 0.7]} />
      <directionalLight position={[220, 320, 180]} intensity={1.9} />
      <directionalLight position={[-260, 120, -160]} intensity={0.6} color="#b9c6ff" />
      <directionalLight position={[0, -200, 120]} intensity={0.25} />
      <Suspense fallback={null}><Assembly {...props} /></Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
    </Canvas>
  );
}

