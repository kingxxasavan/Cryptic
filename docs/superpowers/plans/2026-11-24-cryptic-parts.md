# Cryptic Parts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketplace with Cryptic Parts: describe a thing, the AI researches real sizes and designs every part as an editable recipe, you explode, edit, color, export and share it.

**Architecture:** Next.js 16 App Router. Pure TypeScript recipe library (`lib/recipe`) shared by browser and server. manifold-3d builds meshes in a Web Worker; three.js via @react-three/fiber draws them. Server routes call NVIDIA (chat + TRELLIS) and the web; Firebase holds accounts and shared projects.

**Tech Stack:** next 16, react 19, tailwind 4, three 0.187, @react-three/fiber 9, @react-three/drei 10, manifold-3d 3.5, fflate, firebase 11, vitest 3.

**Spec:** `docs/superpowers/specs/2026-11-24-cryptic-3d-parts-design.md`

## Global Constraints

* Units are millimetres and degrees everywhere; exports are in mm.
* Limits: 60 parts per project, 200 nodes per part, brief up to 60,000 characters.
* No `eval` or `new Function` anywhere; expressions go through `lib/recipe/expr.ts`.
* `NVIDIA_API_KEY`, `TAVILY_API_KEY`, `OWNER_EMAIL` are server only.
* AI routes need a Firebase ID token; 40 AI requests per person per day, owner unlimited.
* Tests: `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

## Review Focus

* A slider dragged to its min or max (or a param of 0) must never crash the worker; a part whose shape fails to build shows an error badge and keeps the last good mesh.
* AI output that is not valid JSON, has unknown node types, or references missing params must be rejected with a readable message, never applied half way.
* A shared link opened signed out must show the model and downloads and must not be able to write.
* Exports of a project with hidden parts export only what the button says (one part, visible parts, everything).
* Research that returns nothing still produces a design with every size marked estimated.

---

### Task 1: Clear the marketplace, scaffold the app shell

**Files:** delete `app/*` marketplace routes, `components/*`, `lib/*` (keep `lib/firebase.ts`), old tests and old docs; modify `package.json`, `app/layout.tsx`, `app/globals.css`, `README.md`, `database.rules.json`; create `app/page.tsx`.

- [ ] Remove old code; add deps (`three @react-three/fiber @react-three/drei manifold-3d fflate`, dev `@types/three`).
- [ ] Layout and dark theme tokens; landing page with the "describe your project" box (no behaviour yet).
- [ ] `npm run build` passes. Commit "Clear the marketplace, Cryptic Parts shell".

### Task 2: Recipe types, expressions, validator

**Files:** `lib/recipe/types.ts`, `lib/recipe/expr.ts`, `lib/recipe/validate.ts`; tests `tests/expr.test.ts`, `tests/validate.test.ts`.

**Interfaces — Produces:** `evalExpr(src: string | number, params: Record<string, number>): number` (throws `ExprError`); `validateProject(x: unknown): { ok: true, project: Project } | { ok: false, errors: string[] }`; `paramValues(part: Part): Record<string, number>`; types `Project, Part, Node, Param, Fact, Material`.

- [ ] Tests: `evalExpr("arm_length - 2 * wall", {arm_length: 140, wall: 2}) === 136`; `min(a,b)`; unknown name throws; `"process.exit()"` throws; numbers pass through. Validator: rejects unknown node type with the path in the message; rejects 61 parts; rejects a node expression naming a missing param; accepts a minimal valid project; clamps nothing silently.
- [ ] Implement; tests pass; commit.

### Task 3: Geometry from recipes

**Files:** `lib/geometry/build.ts` (recipe → manifold), `lib/geometry/mesh.ts` (manifold → `{ positions: Float32Array, indices: Uint32Array }`), `lib/geometry/worker.ts`, `lib/geometry/client.ts`, `lib/geometry/measure.ts`; tests `tests/build.test.ts`, `tests/measure.test.ts`.

**Interfaces — Produces:** `buildPart(wasm, part): { mesh, bbox: [min, max], volume }`; worker message `{ type: "build", key, part }` → `{ key, mesh, bbox, volume } | { key, error }`; `useMeshes(parts)` hook in `client.ts`; `weightGrams(volumeMm3, material)`, `DENSITY` table.

- [ ] Tests (manifold-3d runs in node): box 10×20×30 volume 6000 and bbox; tube od 10 id 6 h 10 volume π(25−9)·10 within 1%; subtract makes a smaller volume; extrude of a square; `array` count 3; hull of two spheres is watertight (`status === 0`); a zero size box returns an error, not a throw.
- [ ] Implement; tests pass; commit.

### Task 4: Exports and spec sheet

**Files:** `lib/export/{stl,obj,ply,gltf,threemf,csv}.ts`; tests `tests/export.test.ts`.

**Interfaces — Produces:** `toSTL(meshes): ArrayBuffer`, `toOBJ(meshes): { obj, mtl }`, `toPLY(meshes): ArrayBuffer`, `toGLB(meshes): Promise<ArrayBuffer>`, `to3MF(meshes): Uint8Array`, `specCSV(project, measures): string`, where `meshes: { name, color, mesh, position, rotation }[]`.

- [ ] Tests: STL byte length = 84 + 50·triangles; 3MF unzips with `3D/3dmodel.model` containing one `<object>` per part and color resources; CSV header and one row per part with W×D×H.
- [ ] Implement; tests pass; commit.

### Task 5: Editor state, AI change lists, undo

**Files:** `lib/editor/state.ts`, `lib/editor/changes.ts`; tests `tests/changes.test.ts`.

**Interfaces — Produces:** `applyChanges(project, changes: Change[]): { project } | { error }` (all or nothing, validated), `Change = { op: "set_param", part, name, value } | { op: "set", part, field, value } | { op: "replace_shape", part, shape, params? } | { op: "add_part", part } | { op: "remove_part", part }`; `useEditor()` reducer with `undo`, `redo`, `select`, `update`.

- [ ] Tests: set_param in range; an unknown part id errors and leaves the project unchanged; add_part then remove_part round trip; undo after applyChanges restores the exact previous project.
- [ ] Implement; tests pass; commit.

### Task 6: The editor and viewer UI

**Files:** `app/p/[id]/page.tsx`, `app/p/[id]/view/page.tsx`, `components/viewer/*` (Scene, PartMesh, Explode, Float), `components/editor/*` (PartsList, Inspector tabs: Part, Brief, Ask AI, Specs, Research), `components/ui/*`.

- [ ] Orbit, explode slider (offset = (partCentre − assemblyCentre) · k), float toggle, select + outline, TransformControls for move/rotate, sliders bound to params, color/material pickers, add from shape library, undo/redo keys.
- [ ] Browser check in Chromium with a sample project (the glasses); commit.

### Task 7: AI on the server

**Files:** `lib/server/nvidia.ts` (catalogue, ranked families, fallback, `chat(messages, opts)`), `lib/server/search.ts` (Tavily or free sources, `research(queries)`), `lib/server/auth.ts` (verify ID token via identitytoolkit `accounts:lookup`), `lib/server/quota.ts`, `lib/ai/prompts.ts`, `lib/ai/json.ts`; routes `app/api/design/route.ts`, `app/api/edit/route.ts`, `app/api/status/route.ts`; tests `tests/json.test.ts`, `tests/prompts.test.ts`.

- [ ] Tests: `extractJson` finds the object in prose and code fences, fixes a trailing comma; design prompt contains the brief and every fact id; edit prompt contains the selected part.
- [ ] Streaming NDJSON progress (`{ step }`, `{ project }`, `{ error }`); one repair round on validation failure; commit.

### Task 8: Realistic look (TRELLIS)

**Files:** `app/api/realistic/route.ts`, `components/viewer/RealisticMesh.tsx`.

- [ ] POST to `https://ai.api.nvidia.com/v1/genai/microsoft/trellis` with `{ prompt (≤77 chars), mode: "text", seed }`; accept `artifacts[0].base64` or a GLB body; scale into the part bbox; failure shows the message; commit.

### Task 9: Accounts, saving, sharing

**Files:** `lib/store/{local,cloud}.ts`, `components/auth/*`, `app/projects/page.tsx`, `database.rules.json` (`parts` block).

- [ ] IndexedDB when signed out; RTDB when signed in; Share toggle; view page reads shared projects without auth; Make a copy; rules checked in the emulator (owner writes, stranger can't, shared readable signed out); commit.

### Task 10: README and end to end

- [ ] README: what it is, deploy on Vercel, env vars, Firebase rules, Andrew's iframe snippet.
- [ ] E2E in Chromium with stubbed AI: create → explode → slider → export each format → share → open view link. Push.
