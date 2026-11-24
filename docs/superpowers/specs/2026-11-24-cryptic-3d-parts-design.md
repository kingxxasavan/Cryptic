# Cryptic Parts: AI 3D part designer

Design for the site that replaces the marketplace code in this repo. Written
2026-11-24 from the conversation with the owner.

## Intent

The owner is building a project with many physical parts (the Cryptic smart
glasses: frame, lenses, hinges, temple arms, battery and camera housings).
They want to describe the thing, hand over everything they already have (the
brainstorming conversations, plans, what it's for), and get every part as a
3D model with real sizes. The AI should research the real world first, then
build each part. The owner wants to pull the assembly apart to see every part
on its own, change the shapes by hand or by asking, add parts, see sizes,
materials and colors, and export any part in any common format.

It also has to be good enough to share with Andrew, who built a site for his
TSA project where people ask for 3D parts they need. A part made here should
be something he can send people a link to, and something they can download
and print.

## Goals

1. **Describe and brief.** A project starts from a description ("smart
   glasses with a camera in the bridge and a battery in each arm") plus a
   **Brief**: a large text area for pasted brainstorm conversations, plans,
   constraints and goals. The AI reads the brief on every generation and edit.
2. **Research first.** Before designing, the AI searches the web for the real
   sizes and conventions of the item and its parts (standard hinge screw
   sizes, typical temple length, lens width, battery cell sizes), reads the
   best pages, and keeps the facts with their links.
3. **Parts with real sizes.** The result is a project of named parts. Each
   part has a purpose, how it attaches to the others, a material, a color,
   and a shape built from a recipe with named sizes in millimetres. Every
   size says whether it was **researched** (with its source) or **estimated**.
4. **See it.** A 3D view that orbits, zooms, and floats gently when idle (can
   be switched off). An **exploded view** slider pulls the parts apart from
   the assembly's centre. Click a part to select it; hide or isolate parts.
5. **Edit by hand.** For the selected part: a slider and number box for every
   named size, a move/rotate gizmo, a color picker, a material picker,
   rename, duplicate, delete. Add a part from a shape library. Undo and redo.
6. **Edit by asking.** A chat box that changes the selected part or the whole
   project: "make the left arm 5 mm longer", "add a USB-C cutout to the
   battery housing", "add a nose pad". The AI answers with changes to the
   recipe, which apply as one undoable step and are listed in the chat.
7. **Details.** Overall size, and per part: width × depth × height, volume,
   estimated weight from the material's density, material notes, color (hex),
   and sources. A printable **spec sheet** and a CSV of the same.
8. **Realistic look.** Per part, **Make it look real** asks NVIDIA's hosted
   TRELLIS model for a textured mesh, fitted to the part's size and position.
   A toggle swaps between the exact recipe shape and the realistic one.
9. **Export.** Any part, the visible parts, or the whole project as **STL**
   (binary), **OBJ** (+MTL colors), **GLB** (colors and materials), **3MF**
   (multi part with colors, what printer software prefers) and **PLY**. Sizes
   are millimetres. The realistic mesh exports too, labelled as approximate.
10. **Share.** Signed in projects save to the cloud. **Share** gives a link
    anyone can open without an account: a read only view with the 3D model,
    the spec sheet and the downloads, plus **Make a copy** for signed in
    people. The view page also works inside an iframe so Andrew can put a
    model on his site.

## Non goals

* True CAD (rounded edges as real fillets, STEP files). Possible later by
  translating recipes to OpenCascade at export time.
* Slicing or sending to a printer.
* Several people editing the same project at once.
* Selling, payments, or the old marketplace.
* Connecting to Andrew's site beyond links and the embeddable view.

## Anti goals (a failure even if it works)

* Sizes the AI made up without saying so.
* Parts that look right but export as broken, non watertight meshes that a
  slicer rejects.
* A site that doesn't run on a school Chromebook or a phone browser.
* The NVIDIA key, or any key, reaching the browser.
* A shared link that lets a stranger change someone's project.

## Constraints

* Runs in the browser; hosted on Vercel. The heavy geometry work happens in a
  Web Worker so the page never freezes.
* AI through the owner's existing NVIDIA key (`NVIDIA_API_KEY`), server side
  only. No new paid service is required. `TAVILY_API_KEY` is optional and
  makes research dependable (the free search sources can turn servers away;
  see the hub's web search notes).
* Data in the repo's existing Firebase project (`chat-f6735`), under a new
  `parts` node in the Realtime Database, with its own rules block the owner
  pastes next to the existing ones. Sign in with Google or email.
* Not signed in: projects live in the browser (IndexedDB) and can be exported;
  signing in moves them to the cloud.

## Approaches considered

1. **Recipe parts (chosen).** The AI writes each part as a JSON recipe of
   shapes (boxes, cylinders, tubes, extrusions, revolves, hulls, holes cut
   out) with named sizes. A WASM geometry kernel (manifold-3d) turns recipes
   into exact, watertight meshes in the browser. Sliders fall out of the
   named sizes; shared projects are plain data, so opening someone's link
   runs no code of theirs. Costs: no true fillets or STEP at first.
2. **CAD engine in the browser (OpenCascade via replicad).** Real CAD with
   fillets and STEP export. Costs: about 10 MB to download, slow rebuilds on a
   Chromebook, and the AI writes code, which fails more often and must be
   sandboxed because a shared project would run someone else's code.
3. **OpenSCAD in the browser.** Models write OpenSCAD well. Costs: slow
   rebuilds, colors and materials bolted on, editing means editing code.

The owner asked for "whichever runs on the web". All three can, but 1 runs
best there (smallest download, fastest rebuild, safe to share), so it's the
pick.

## Design

### Pages

* `/` : what it does, a box to describe a new project, recent projects.
* `/p/[id]` : the editor (owner) or the view (anyone else).
* `/p/[id]/view` : read only view, no site chrome, safe in an iframe.
* `/projects` : my projects (signed in).

### The editor

Three panes on a laptop, stacked on a phone:

* **Parts** (left): the parts list with color dots, eye toggles, the
  **Exploded** slider, **Float** toggle, **Add part**.
* **3D view** (centre): orbit/zoom/pan, selection outline, move/rotate gizmo
  on the selected part, a ground grid in mm, a size readout.
* **Inspector** (right), tabs: **Part** (sizes as sliders, material, color,
  purpose, attaches to, sources), **Brief** (the context text, editable),
  **Ask AI** (the chat), **Specs** (spec sheet, CSV, exports), **Research**
  (every fact found, with its link).

### The recipe (data, versioned)

```
Project { v: 1, id, name, description, brief, parts: Part[], research: Fact[],
          createdAt, updatedAt, owner }
Part    { id, name, purpose, attachesTo: string[], material, color (hex),
          finish ("matte"|"satin"|"gloss"|"metal"|"clear"), visible,
          position [x,y,z] mm, rotation [x,y,z] deg,
          params: { [name]: { value, min, max, unit: "mm"|"deg"|"count",
                              source: "researched"|"estimated", factId?, note? } },
          shape: Node, realistic?: { meshId, scale, offset } }
Node    = box {w,d,h} | cylinder {d,h,segments?} | tube {od,id,h} | sphere {d}
        | cone {d1,d2,h} | torus {D,d} | extrude {points:[[x,y]], h}
        | revolve {points:[[r,z]], angle?} | hull {children}
        | union|subtract|intersect {children}
        | translate {by:[x,y,z], child} | rotate {by:[x,y,z], child}
        | mirror {axis, child} | array {count, step:[x,y,z], child}
Fact    { id, text, url, title }
```

Any number in a node may be a param name or a small expression over params
("arm_length - 2 * wall"), evaluated by a tiny parser (numbers, + - * / ( ),
min, max), never by `eval`. A validator checks the whole project (known node
types, numbers in range, no more than 200 nodes per part, 60 parts) before
anything is built or saved; the AI's output goes through the same validator
and gets one repair round.

### AI

* **Model:** NVIDIA's hosted chat models, picked per request from a ranked
  list of strong families (DeepSeek V3+, Qwen 3, Kimi K2, GPT-OSS 120B,
  Nemotron Ultra), checked against NVIDIA's live catalogue, moving to the next
  on failure: the same approach as the hub, so a retired model never breaks
  the site. The model that answered is shown on each AI message.
* **Create** (`POST /api/design`): plan search queries → search and read the
  top pages → extract facts with links → design the parts as recipe JSON that
  cites fact ids → validate (one repair round) → stream progress to the page
  ("Researching hinge sizes…", "Designing the temple arm…").
* **Edit** (`POST /api/edit`): the project, the selection and the request in;
  a list of changes out (set param, set field, replace shape, add part, remove
  part), validated and applied as one undo step.
* **Realistic** (`POST /api/realistic`): TRELLIS on NVIDIA
  (`ai.api.nvidia.com/v1/genai/microsoft/trellis`, text mode, a prompt of up
  to 77 characters built from the part's name, material and color). The GLB
  comes back to the browser and is scaled into the part's bounding box. The
  endpoint has been reported flaky, so a failure says so plainly and the
  exact shape stays.

### Geometry and exports

* manifold-3d in a Web Worker builds each part's mesh; results are cached by
  a hash of the part's recipe, so moving a slider rebuilds only that part.
* three.js with @react-three/fiber and drei for the view.
* Exports with three.js exporters for STL, OBJ, GLB and PLY; 3MF written by
  hand (a zip of the model XML with per part colors). Weight uses a density
  table (PLA 1.24, PETG 1.27, ABS 1.04, TPU 1.21, resin 1.15, aluminium 2.70,
  steel 7.85, acrylic 1.18, polycarbonate 1.20, silicone 1.10 g/cm³…).

### Saving and sharing

* `parts/projects/$id`: the project, written only by its owner; readable by
  anyone when `shared` is true. `parts/meshes/$id`: realistic meshes as
  base64, capped at 6 MB each. `parts/byOwner/$uid/$id`: the owner's list.
* Not signed in: IndexedDB, with a banner offering to sign in to save and
  share.

### Testing

Unit tests (vitest) for the expression parser, the validator, the recipe
evaluator's node handling, exports (STL triangle count, 3MF zip contents),
weights, and applying AI change lists. An end to end run in Chromium with the
AI stubbed: create a project, explode it, change a size, export each format,
share, open the view link.

## Calls I made (the owner can change any)

* Name: **Cryptic Parts**.
* Shared links are view and download for anyone; editing needs the owner.
* Realistic meshes are approximate and labelled so; the exact recipe stays
  the source of truth for sizes.
* AI needs a signed in account (the routes check the Firebase ID token), so a
  shared link can't spend the owner's NVIDIA credits. Each person gets 40 AI
  requests a day; the owner (`OWNER_EMAIL`) has no limit.
* When research finds nothing usable, the design still happens, every size is
  marked estimated, and the Research tab says the search came back empty.
* API routes run on Vercel's Node runtime with streaming and a 300 second
  limit, since research plus design can take a minute.
* The marketplace code, its tests and its docs are removed from the branch
  (they stay in git history and on the other branches).

## Left to the builder

The visual design (dark, matching the Cryptic look), prompt wording, the
model ranking details, the shape library's starter shapes, and how the
progress stream is drawn.
