"use client";
// Where projects live: in this browser (IndexedDB). There are no accounts.
//
// Sharing puts a copy at parts/shared/$id/data, which anyone with the link can
// read. Only the browser that shared it can change it: it holds a secret key,
// and every write has to quote the current key and replace it with a new one
// (the database rules check both and keep the key unreadable). A key that's
// quoted correctly once is never valid again, so it can't be replayed.
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";
import type { Project } from "@/lib/recipe/types";
import { normalizeProject } from "@/lib/recipe/normalize";
import { validateProject } from "@/lib/recipe/validate";
import { getFirebaseApp } from "@/lib/firebase";

export interface Summary { id: string; name: string; updatedAt: number; parts: number; shared?: boolean }

const LKEY = (id: string) => "project:" + id;
const MKEY = (id: string) => "mesh:" + id;
const SKEY = (id: string) => "sharekey:" + id;

async function rtdb() {
  const app = await getFirebaseApp();
  const m = await import("firebase/database");
  return { db: m.getDatabase(app), m };
}

/** JSON round trip drops undefined, which the database refuses. */
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function newId(len = 10): string {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

// ---- This browser ----------------------------------------------------------------
export async function saveLocal(p: Project) { await idbSet(LKEY(p.id), plain(p)); }
export async function isMine(id: string): Promise<boolean> { return !!(await idbGet(LKEY(id)).catch(() => null)); }

export async function listProjects(): Promise<Summary[]> {
  const out: Summary[] = [];
  for (const k of (await idbKeys().catch(() => [])) as string[]) {
    if (!String(k).startsWith("project:")) continue;
    const p = (await idbGet(k)) as Project | undefined;
    if (p) out.push({ id: p.id, name: p.name, updatedAt: p.updatedAt, parts: (p.parts || []).length, shared: p.shared });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---- The shared copy ----------------------------------------------------------------
// One write at a time per project, so each one quotes the key the last one set.
const queue = new Map<string, Promise<unknown>>();
function serial<T>(id: string, job: () => Promise<T>): Promise<T> {
  const next = (queue.get(id) || Promise.resolve()).catch(() => {}).then(job);
  queue.set(id, next);
  return next;
}

async function writeShared(id: string, data: Project | null): Promise<void> {
  const { db, m } = await rtdb();
  const current = (await idbGet(SKEY(id)).catch(() => null)) as string | null;
  const next = newId(32);
  const base = "parts/shared/" + id;
  try {
    if (current) await m.update(m.ref(db), { [base + "/data"]: data ? plain(data) : null, [base + "/prev"]: current, [base + "/k"]: next });
    else await m.set(m.ref(db, base), { data: data ? plain(data) : null, k: next });
  } catch (e) {
    throw new Error(/permission/i.test(String((e as Error).message))
      ? "This share link was changed from another browser or tab, so this one can't update it. Copy the project to share it again."
      : "Couldn't update the share link: " + (e as Error).message);
  }
  await idbSet(SKEY(id), next);
}

/** Turns the share link on (and uploads any realistic looks it uses). */
export function shareProject(p: Project): Promise<void> {
  return serial(p.id, async () => {
    await writeShared(p.id, { ...p, shared: true });
    for (const part of p.parts) if (part.realistic) await uploadMesh(part.realistic.meshId);
  });
}

/** Turns the share link off. The link then says it isn't shared. */
export function unshareProject(id: string): Promise<void> {
  return serial(id, () => writeShared(id, null));
}

/** Saves in this browser, and updates the share link when it's on. */
export async function saveProject(p: Project): Promise<void> {
  await saveLocal(p);
  if (p.shared) await serial(p.id, () => writeShared(p.id, p));
}

export async function loadProject(id: string): Promise<{ project: Project; where: "browser" | "shared" } | { error: string }> {
  const local = await idbGet(LKEY(id)).catch(() => null);
  if (local) {
    const v = validateProject(normalizeProject(local));
    if (v.ok) return { project: v.project, where: "browser" };
  }
  try {
    const { db, m } = await rtdb();
    const snap = await m.get(m.ref(db, "parts/shared/" + id + "/data"));
    if (!snap.exists()) return { error: "There's no shared project at this link. It may have been unshared." };
    const v = validateProject(normalizeProject(snap.val()));
    if (!v.ok) return { error: "This project couldn't be read: " + v.errors[0] };
    return { project: v.project, where: "shared" };
  } catch (e) {
    return { error: "Couldn't load the project: " + (e as Error).message };
  }
}

export async function deleteProject(id: string) {
  if (await idbGet(SKEY(id)).catch(() => null)) await unshareProject(id).catch(() => {});
  await idbDel(LKEY(id)).catch(() => {});
  await idbDel(SKEY(id)).catch(() => {});
}

// ---- Realistic meshes (TRELLIS GLB files) --------------------------------------
// Kept in this browser; uploaded (write once, by random id) when the project is shared.
const MAX_CLOUD_MESH = 6 * 1024 * 1024;
const toB64 = (u8: Uint8Array) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function saveMesh(id: string, glb: Uint8Array): Promise<void> { await idbSet(MKEY(id), glb); }

async function uploadMesh(id: string): Promise<void> {
  const glb = (await idbGet(MKEY(id)).catch(() => null)) as Uint8Array | null;
  if (!glb || glb.byteLength > MAX_CLOUD_MESH) return;
  try {
    const { db, m } = await rtdb();
    await m.set(m.ref(db, "parts/meshes/" + id), toB64(glb));
  } catch { /* already uploaded (write once), or offline: the exact shape still shows */ }
}

export async function loadMesh(id: string): Promise<Uint8Array | null> {
  const local = (await idbGet(MKEY(id)).catch(() => null)) as Uint8Array | null;
  if (local) return local;
  try {
    const { db, m } = await rtdb();
    const snap = await m.get(m.ref(db, "parts/meshes/" + id));
    if (!snap.exists()) return null;
    const u8 = fromB64(String(snap.val()));
    await idbSet(MKEY(id), u8).catch(() => {});
    return u8;
  } catch { return null; }
}
