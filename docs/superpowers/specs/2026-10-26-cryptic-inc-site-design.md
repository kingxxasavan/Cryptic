# Cryptic Inc: company site design

## Goal

Replace the Cryptic marketplace app in this repo with the Cryptic Inc company website. It shows off every project the company has shipped (with real screenshots of each site and its main functions), the contribution history behind them, the projects coming next, and a way to collaborate. Dark, styled like PolyOS (glass windows, floating dock, crystal backdrop) but with better fonts and a richer palette. Heavy on animation, still smooth on a school Chromebook.

## What the user decided

* The marketplace code is removed completely. This repo becomes only the company site.
* Live links use the known domains (arkia.buzz for Cryptic Hub, poly-os-7.vercel.app for PolyOS) and `<vercel project>.vercel.app` guesses for the rest. All links live in one data file so they are easy to fix.
* Future projects are drafted by Claude from where the current projects are heading. The user edits them later.
* Collaboration is a real form saved to Firebase, plus a links block the user can add their own links to.
* Look: dark, PolyOS style, better fonts and color.

## Assumptions

* The Vercel project `cryptic-marketplace` deploys from this repo, so after this lands its URL shows the company site. The Marketplace card is therefore marked "Archived v1" and links to the source at commit `b1c615d` instead of a live site.
* "Contributions" means the real git history of the six repos: commits, lines changed, active days, a year heatmap and milestones.
* The prism and amethyst PolyOS wallpapers are third party photos with unclear licenses (see PolyOS `CREDITS.md`), so the site uses its own generated dark crystal backdrop instead.
* No contact email is published unless the user adds one to the links file.

## The projects

| Slug | Name | Repo | Link | Status |
| --- | --- | --- | --- | --- |
| `cryptic-hub` | Cryptic Hub | kingxxasavan/cryptichub | https://arkia.buzz | Live |
| `jarvis` | JARVIS | kingxxasavan/jarvis | https://jarvis.vercel.app (guess) | Live |
| `polyos` | PolyOS 7 for Debian | kingxxasavan/poly-os-7-debain-receration | https://poly-os-7.vercel.app | Live |
| `foundry` | Foundry | kingxxasavan/Web---templates | https://web-templates.vercel.app (guess) | Live |
| `epri` | EPRI | kingxxasavan/REQIG | https://reqig.vercel.app (guess) | Live |
| `marketplace` | Cryptic Marketplace | kingxxasavan/Cryptic @ b1c615d | none | Archived v1 |

Each project has: tagline, description, year, category, accent color, stack, cover image, and 3 to 6 functions (title, short explainer, screenshot).

## Images

* Cryptic Hub: `assets/shots/*.jpg` from its repo (home, ARIA, calendar, notes, hallows).
* PolyOS: `docs/screenshots/*.jpg` from its repo (desktop, start menu, PolyMarket, files, settings, Vara, installer).
* Foundry: `public/thumbs/*.webp` from its repo (the nine templates).
* Marketplace: captured with Playwright from this repo's current build before the code is deleted (home, explore, product, cart or checkout, library or creator dashboard).
* EPRI: captured with Playwright from a local Vite run, using its guided tour sample bakery (landing, dashboard, advisor, pricing studio).
* JARVIS: captured with Playwright from a local run of `web/`. It needs Supabase, so if only the login screen renders, the card uses that plus the architecture as a designed diagram, and the user is told.
* All images are copied into `public/projects/<slug>/` and served with `next/image`.

## Visual system

**Backdrop.** A near black violet base (`#07060c`) with a generated low poly crystal image (violet, indigo, cyan facets, darkened) fixed behind everything, slow drifting aurora glows on top, and the existing film grain. Generated once by a script into `public/backdrop.webp`.

**Windows.** Every section sits in a PolyOS style window: rounded 20px, dark glass surface `rgb(17 15 27 / 0.66)`, 1px hairline `rgb(255 255 255 / 0.08)`, inner top highlight, a title bar with an app icon, title and decorative minimize and close buttons. To stay smooth on Chromebooks, real `backdrop-filter` blur is only used on the dock, the start menu and the title bars that stick. Big windows use solid glass gradients over the already soft backdrop.

**Dock.** Floating bottom dock like the PolyOS taskbar. Left: the Cryptic mark (opens the start menu). Middle: one icon per section (Projects, Functions, Contributions, Future, Collaborate). Right: a live clock and date. Icons magnify a little on hover, a dot shows the section in view. On phones it shrinks to icons only.

**Start menu.** Pressing the mark, `/` or `Ctrl K` opens a PolyOS style start menu: a search field plus a pinned grid of the six projects and the sections. Typing filters. Enter opens the result. Escape closes. Focus is trapped while open.

**Color tokens.**

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#07060c` | page base |
| `glass` | `rgb(17 15 27 / 0.66)` | windows |
| `glass-strong` | `rgb(22 20 34 / 0.86)` | dock, start menu |
| `line` / `line-strong` | white at 8% / 14% | hairlines |
| `fg` | `#f4f3fb` | text |
| `muted` | `#a9a7bd` | secondary text |
| `faint` | `#6f6d85` | labels |
| `accent` | `#7c8cff` | links, focus, active (brighter than PolyOS `#678fd9`) |
| `violet` | `#a78bfa` | highlights |
| `cyan` | `#67e8f9` | stats, live dots |
| `pink` | `#f0abfc` | gradient end |
| `ok` | `#86efac` | success |

Signature gradient (PolyMarket banner, richer): `linear-gradient(120deg, #5b7cfa, #8b5cf6 45%, #d946ef)`.

Each project has its own accent used for its card glow and its page header.

**Fonts.** Sora for display (the geometric feel of Poppins, sharper), Geist for UI and body (cleaner than Inter), Geist Mono for labels, stats and the decrypt effect. All through `next/font/google`.

## Motion

* **Decrypt text.** The hero title, section headings and project names scramble through glyphs and resolve left to right when they first come into view. Project names scramble again on hover. Uses `requestAnimationFrame`, text width is reserved so nothing shifts.
* **Window open.** Windows enter with scale 0.96 to 1, fade and a 12px rise, 420ms ease out, staggered inside a group. Once only.
* **Hero.** Cursor spotlight on the backdrop, aurora drift, backdrop parallax on scroll, count up stats, endless marquee of project names.
* **Project cards.** Up to 6 degree tilt toward the pointer, the screenshot inside the browser frame moves the other way for depth, accent glow follows the pointer. Off on touch and reduced motion.
* **Functions.** Sticky scroll: left side lists functions, right side crossfades and scales in the matching screenshot.
* **Contributions.** Heatmap cells fade in on a diagonal, bars grow, counters count up.
* **Dock.** Magnify on hover, the active dot slides between icons (shared layout animation).
* **Reduced motion.** Everything above turns into plain fades or nothing. Decrypt shows the final text right away.
* Only `transform` and `opacity` animate. Framer Motion (already a dependency) handles it, no new animation libraries.

## Pages

### `/`

1. **Hero.** Big decrypting "Cryptic Inc.", one line about the company, two buttons (See projects, Collaborate), stats (projects, commits, lines shipped, active days), marquee.
2. **Projects.** Six window cards in a grid. Each: screenshot in a browser frame, status chip, name, tagline, stack chips, and Visit, Source and Details buttons (Visit hidden when there is no live link).
3. **Functions.** Sticky scroll section with a tab per project. Picking a tab shows that project's functions with their screenshots.
4. **Contributions.** Totals row, a 53 week heatmap across all repos, commits per project bars (in each project's accent), and a milestone timeline (first commit and biggest releases of each project).
5. **Future.** Roadmap cards with a status (Exploring, Designing, Next up), a short pitch and which current project it grows from.
6. **Collaborate.** The form on one side, the links block on the other.
7. **Footer.** Mark, short line, links, "Presented by Cryptic Inc." and the year.

### `/projects/[slug]`

Statically generated for all six. Header in the project accent with a large screenshot, overview, a gallery of functions (image plus explainer for each, click to open full size in a lightbox), stack, links, that repo's commit stats and mini heatmap, then previous and next project.

### Not found

A PolyOS style "app not responding" window with a button home.

## Data

* `lib/data/projects.ts`: the six projects (typed `Project`).
* `lib/data/future.ts`: drafted future projects.
* `lib/data/links.ts`: socials and contact links the user edits. Starts with the GitHub profile. `contactEmail` starts empty.
* `lib/data/contributions.json`: generated by `scripts/contributions.mjs`, which reads `git log --numstat` from local clones of the six repos (paths passed as arguments) and writes per repo totals (commits, additions, deletions, first and last commit, active days) plus daily counts for the last 53 weeks. Pure aggregation lives in `lib/contributions.ts` so it can be unit tested. Rerun it any time to refresh.

Drafted future projects (the user will edit):

1. **Cryptic ID**: one account across Hub, JARVIS, EPRI and Foundry. Grows from Hub and JARVIS auth.
2. **PolyOS Web**: try the full PolyOS desktop in the browser, no install. Grows from `main.py dev`.
3. **ARIA Studio**: ARIA's IDE as its own app with one click deploys. Grows from Cryptic Hub.
4. **JARVIS Mobile**: phone app with voice, push reminders and device control. Grows from JARVIS.
5. **Foundry Builder**: mix sections from the templates into your own site and download it. Grows from Foundry.
6. **EPRI Teams**: one view for accountants handling many local businesses. Grows from EPRI.

## Collaboration form

* Fields: name, email, company (optional), what you want to do (Partner, Build with us, Hire us, Invest, Other), message (20 to 2000 characters), plus a hidden honeypot field.
* `lib/collab.ts` validates and normalizes (pure, unit tested). The same rules are in the database rules.
* On submit the client writes to Firebase Realtime Database at `/cryptic/collabs/<push id>` with `createdAt`. No sign in needed.
* `database.rules.json` is replaced by only the collabs rule: create only (`!data.exists()`), validated fields and lengths, nobody can read. The README explains pasting just the `cryptic` block into the shared database rules, like before.
* If the write fails or takes over 8 seconds: when `contactEmail` is set, offer a prefilled email; otherwise show an error and the GitHub link. Success shows a PolyOS style "sent" state.

## Removed

All marketplace routes (`app/explore`, `app/product`, `app/cart`, `app/checkout`, `app/dashboard`, `app/login`, `app/signup`, `app/sell`, `app/creators`, `app/listing`, `app/api`), their components and providers, `lib` modules other than `firebase.ts`, the marketplace tests, `sonner` and other packages nothing uses anymore. The old marketplace spec and plan stay in `docs/` as history.

## Accessibility and performance

* Keyboard reachable dock, start menu and lightbox, visible focus, alt text on every screenshot, AA contrast on glass, `prefers-reduced-motion` respected.
* `next/image` for every screenshot (lazy, responsive sizes), fonts through `next/font`, no 3D library.
* Backdrop filter only on a few small surfaces.

## Testing

* Vitest: every project has a unique slug, valid `https` links, and image files that exist in `public/`; contribution aggregation math; collab validation (good input, each bad field, honeypot).
* `npm run typecheck`, `npm run lint`, `npm run build`.
* Playwright click through on the built site: home renders all six projects, start menu search opens a project page, functions tabs switch, collab form shows validation errors and then succeeds (Firebase or the fallback), no console errors, no horizontal scroll at 375px.

## Out of scope

An admin page to read collab requests (read them in the Firebase console), a blog, a light theme, i18n, a CMS.
