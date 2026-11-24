"use client";
// Where projects live: always in this browser (IndexedDB), and in the cloud
// too when you're signed in. A shared project can be read by anyone with the
// link; only its owner can write it.
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";
import type { Project } from "@/lib/recipe/types";
import { normalizeProject } from "@/lib/recipe/normalize";
import { validateProject } from "@/lib/recipe/validate";
import { getFirebaseApp } from "@/lib/firebase";

export interface Summary { id: string; name: string; updatedAt: number; parts: number; where: "browser" | "cloud"; shared?: boolean }

const LKEY = (id: string) => "project:" + id;
const MKEY = (id: string) => "mesh:" + id;

async function rtdb() {
  const app = await getFirebaseApp();
  const m = await import("firebase/database");
  return { db: m.getDatabase(app), m };
}

/** JSON round trip drops undefined, which the database refuses. */
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export async function saveLocal(p: Project) { await idbSet(LKEY(p.id), plain(p)); }

export async function saveCloud(p: Project, uid: string) {
  const { db, m } = await rtdb();
  const row = plain({ ...p, owner: uid, shared: !!p.shared });
  await m.update(m.ref(db), {
    ["parts/projects/" + p.id]: row,
    ["parts/byOwner/" + uid + "/" + p.id]: { name: p.name, updatedAt: p.updatedAt, parts: p.parts.length, shared: !!p.shared },
  });
}

export async function saveProject(p: Project, uid: string | null) {
  await saveLocal(p);
  if (uid && (!p.owner || p.owner === uid)) await saveCloud({ ...p, owner: uid }, uid);
}

export async function loadProject(id: string): Promise<{ project: Project; where: "browser" | "cloud" } | { error: string }> {
  const local = await idbGet(LKEY(id)).catch(() => null);
  if (local) {
    const v = validateProject(normalizeProject(local));
    if (v.ok) return { project: v.project, where: "browser" };
  }
  try {
    const { db, m } = await rtdb();
    const snap = await m.get(m.ref(db, "parts/projects/" + id));
    if (!snap.exists()) return { error: "There's no project at this link, or it isn't shared." };
    const v = validateProject(normalizeProject(snap.val()));
    if (!v.ok) return { error: "This project couldn't be read: " + v.errors[0] };
    return { project: v.project, where: "cloud" };
  } catch (e) {
    return { error: /permission/i.test(String((e as Error).message)) ? "This project isn't shared. Ask its owner to share it." : "Couldn't load the project: " + (e as Error).message };
  }
}

export async function listProjects(uid: string | null): Promise<Summary[]> {
  const out: Summary[] = [];
  for (const k of (await idbKeys().catch(() => [])) as string[]) {
    if (!String(k).startsWith("project:")) continue;
    const p = (await idbGet(k)) as Project | undefined;
    if (p) out.push({ id: p.id, name: p.name, updatedAt: p.updatedAt, parts: (p.parts || []).length, where: "browser", shared: p.shared });
  }
  if (uid) {
    try {
      const { db, m } = await rtdb();
      const snap = await m.get(m.ref(db, "parts/byOwner/" + uid));
      const v = (snap.val() || {}) as Record<string, { name: string; updatedAt: number; parts: number; shared?: boolean }>;
      for (const [id, s] of Object.entries(v)) {
        const i = out.findIndex((x) => x.id === id);
        const row: Summary = { id, name: s.name, updatedAt: s.updatedAt, parts: s.parts, where: "cloud", shared: s.shared };
        if (i === -1) out.push(row); else if (s.updatedAt >= out[i].updatedAt) out[i] = row;
      }
    } catch { /* offline: the browser's list is still good */ }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string, uid: string | null) {
  await idbDel(LKEY(id)).catch(() => {});
  if (uid) {
    const { db, m } = await rtdb();
    await m.update(m.ref(db), { ["parts/projects/" + id]: null, ["parts/byOwner/" + uid + "/" + id]: null }).catch(() => {});
  }
}

// ---- Realistic meshes (TRELLIS GLB files) --------------------------------------
const MAX_CLOUD_MESH = 6 * 1024 * 1024;
const toB64 = (u8: Uint8Array) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function saveMesh(id: string, glb: Uint8Array, uid: string | null): Promise<{ cloud: boolean }> {
  await idbSet(MKEY(id), glb);
  if (!uid || glb.byteLength > MAX_CLOUD_MESH) return { cloud: false };
  try {
    const { db, m } = await rtdb();
    await m.set(m.ref(db, "parts/meshes/" + id), { owner: uid, glb: toB64(glb) });
    return { cloud: true };
  } catch { return { cloud: false }; }
}

export async function loadMesh(id: string): Promise<Uint8Array | null> {
  const local = (await idbGet(MKEY(id)).catch(() => null)) as Uint8Array | null;
  if (local) return local;
  try {
    const { db, m } = await rtdb();
    const snap = await m.get(m.ref(db, "parts/meshes/" + id + "/glb"));
    if (!snap.exists()) return null;
    const u8 = fromB64(String(snap.val()));
    await idbSet(MKEY(id), u8).catch(() => {});
    return u8;
  } catch { return null; }
}

export function newId(): string {
  const a = new Uint8Array(10);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}
