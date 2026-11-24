# Cryptic Parts

Describe what you're building, paste in everything you've worked out, and get
every part in 3D. The AI researches real sizes on the web, designs each part as
an exact, editable recipe with millimetre sizes, and you can pull the assembly
apart, change any size with a slider (or just ask), pick materials and colors,
and export for printing.

* **Research first.** Search queries, the best pages read, facts pulled out with
  their links. Every size says whether it was *researched* (with its source) or
  *estimated*.
* **Exact parts.** Each part is a recipe of shapes (boxes, cylinders, tubes,
  extrusions, revolves, hulls, holes cut out) built into a watertight solid by
  [manifold](https://github.com/elalish/manifold) in a Web Worker.
* **See it.** Orbit, float, **Exploded** view, click a part, move and rotate it.
* **Edit.** A slider for every size, material, finish, color, position; add
  parts from a shape library; undo and redo (Ctrl+Z / Ctrl+Shift+Z).
* **Ask AI.** "Make the left arm 5 mm longer", "add a USB-C cutout". Changes
  apply all at once or not at all, and undo in one step.
* **Brief.** Paste brainstorms, plans and constraints; the AI reads them every
  time.
* **Specs.** Size, volume and weight per part; CSV and a printable sheet.
* **Export.** 3MF (best for printers, keeps colors), STL, OBJ+MTL, GLB, PLY.
* **Look real.** NVIDIA's TRELLIS makes an approximate textured version of a
  part, fitted to its size. Sizes and exports always use the exact shape.
* **Share.** A link anyone can open to view and download, and an embeddable
  view for other sites.

Open the **sample glasses** on the home page to try everything without the AI.

## Run it

```bash
npm install          # also copies manifold.wasm into public/
npm run dev          # http://localhost:3000
npm test             # unit tests (vitest)
npm run typecheck && npm run lint && npm run build
```

## Deploy on Vercel

1. Vercel → **Add New → Project** → import this repository (framework: Next.js).
2. **Settings → Environment Variables**:
   * `NVIDIA_API_KEY`: the same `nvapi-…` key the hub uses (build.nvidia.com →
     profile → API Keys). Powers the design, edit and realistic look.
   * `OWNER_EMAIL`: your email. You get unlimited AI requests; everyone else gets
     40 a day so a shared link can't run up your NVIDIA credits.
   * `TAVILY_API_KEY` (optional, recommended): makes research dependable. Without
     it the free search sources are used, which can turn Vercel's servers away.
   * `PARTS_MODEL` (optional): pin one NVIDIA model id. Leave it unset and the
     best available model is picked per request, skipping retired ones.
3. Redeploy after adding variables.

## Firebase (accounts, saving, sharing)

The site uses the existing Firebase project `chat-f6735`.

1. **Authentication → Sign in method**: enable **Email/Password** and
   **Google**.
2. **Authentication → Settings → Authorized domains**: add your Vercel domain.
3. **Realtime Database → Rules**: other apps use this database, so **don't
   replace everything**. Copy the `"parts": { … }` block from
   `database.rules.json` and paste it inside your existing `"rules": { … }` next
   to what's there, then **Publish**.

What the rules allow: a project is written only by its owner and read by its
owner, or by anyone when it's shared. The daily AI counter can only go up by
one. Realistic meshes are readable by id.

## Sharing with Andrew

**Share** in the editor turns on the link and shows the embed code:

```html
<iframe src="https://YOUR-SITE/p/PROJECT_ID/view" width="100%" height="480"
        style="border:0;border-radius:12px" title="Part in 3D" allow="fullscreen"></iframe>
```

People who open the link see the model, the spec sheet and every download. Only
the owner can change it; signed in visitors can **Make a copy**.

## How it fits together

| Where | What |
| --- | --- |
| `lib/recipe` | The recipe format, the safe size expressions (`expr.ts`, never `eval`), the validator |
| `lib/geometry` | Recipe → solid (`build.ts`), the worker and its React hook, sizes and weights |
| `lib/editor` | AI change lists (all or nothing) and undo history |
| `lib/export` | STL, OBJ, PLY, GLB, 3MF writers and the spec sheet |
| `lib/ai` | Prompts (the recipe rules the model is given), JSON extraction, the browser client |
| `lib/server` | NVIDIA models with fallback, web research, sign in check, daily limit, the design pipeline |
| `app/api` | `design` (streams progress), `edit`, `realistic`, `status` |
| `components` | The 3D scene, the editor and inspector, sign in, share |

Conventions: millimetres, degrees, Z up (like printers). GLB is converted to
glTF's metres and Y up.

## Testing end to end

`scripts/e2e.cjs` drives Chromium through sign up, an AI design (stubbed),
research, an AI edit, undo, the TRELLIS failure message, sharing, the embed
view, a stranger's view only page and unsharing, against the Firebase
emulators with this repo's rules:

```bash
npx firebase emulators:start --only auth,database --project chat-f6735
npm run build && npm start
node scripts/e2e.cjs http://127.0.0.1:3000
```

Open the site with `?emulators=1` on localhost to point it at the emulators.

## Known limits

* TRELLIS on NVIDIA's hosted API has had outages; when it fails the site says
  so and the exact shape stays.
* Recipes don't do true CAD fillets or STEP files yet. Rounded parts are made
  with hulls; STEP could come later by translating recipes to OpenCascade.
