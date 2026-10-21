# Cryptic Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dark luxury AI asset marketplace (Claude Skills, GPTs, prompts, courses) as a working demo on Vercel, backed by Firebase with a local fallback.

**Architecture:** Next.js App Router renders a seeded catalog from code. A `DataStore` interface hides Firebase Auth + RTDB behind a hybrid store that falls back to localStorage. Route handlers do server side search and checkout validation.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Firebase JS SDK v11, Vitest, Playwright (preinstalled Chromium).

**Spec:** `docs/superpowers/specs/2026-10-21-cryptic-marketplace-design.md`

## Global Constraints

* No real payments. Test card `4242 4242 4242 4242` is the only card that succeeds.
* No secret env vars required to build or run.
* Firebase config for project `chat-f6735`, RTDB `https://chat-f6735-default-rtdb.firebaseio.com/`. All writes under `/cryptic`.
* Categories exactly: `claude-skills`, `gpts`, `prompt-packs`, `courses`, `context-engineering`, `agents-mcp`.
* Prices stored as integer cents.
* Dark luxury theme, accessible contrast, works at 375px width.

## Review Focus

1. Search with no matches or odd input (empty, whitespace, `%`, emoji) returns an empty list and the page shows an empty state, never a crash.
2. Firebase failure (auth provider disabled, RTDB permission denied, offline) drops to local mode without throwing to the UI.
3. Checkout with an empty cart, a cart with unknown product ids, or a non test card returns 400 with a message.
4. Unknown `/product/[slug]` or `/creators/[handle]` renders the 404 page.
5. Cart quantity edge cases: adding the same product twice keeps quantity 1 (digital goods), removing a missing id is a no-op.

---

### Task 1: Scaffold, theme, catalog and cart logic

**Files:**
* Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `app/globals.css`, `app/layout.tsx`
* Create: `lib/types.ts`, `lib/catalog.ts`, `lib/data/products.ts`, `lib/data/creators.ts`, `lib/cart.ts`, `lib/format.ts`
* Test: `tests/catalog.test.ts`, `tests/cart.test.ts`

**Interfaces:**
* Produces: `Product { id, slug, title, tagline, description, category: CategoryId, priceCents, creatorHandle, rating, reviewCount, sales, tags: string[], createdAt, featured?, accent, contents: ContentItem[], preview: string }`, `Creator { handle, name, bio, avatarHue, verified, followers }`, `searchProducts(products: Product[], q: SearchQuery): Product[]` with `SearchQuery { q?, category?, min?, max?, sort?: 'trending'|'newest'|'price-asc'|'price-desc'|'rating' }`, `getProduct(slug)`, `getCreator(handle)`, `CATEGORIES`.
* Produces: `CartLine { productId }`, `addLine(lines, id)`, `removeLine(lines, id)`, `cartTotals(lines, products, code?) => { subtotal, discount, fee, total }` (fee = 0, code `CRYPTIC10` = 10% off subtotal, rounded to cents), `formatPrice(cents)`.

- [ ] Write tests: search matches title/tags case insensitive; whitespace and `%` queries don't throw; category filter; price range; each sort order; `addLine` twice gives one line; `removeLine` missing id returns same contents; `cartTotals` with `CRYPTIC10` on 4900 gives discount 490 and total 4410; unknown product ids are ignored in totals.
- [ ] Run `npx vitest run`, expect FAIL.
- [ ] Implement, seed 40 products across all 6 categories and 10 creators.
- [ ] Run `npx vitest run`, expect PASS. Commit.

### Task 2: Data store (Firebase + local fallback)

**Files:** Create `lib/firebase.ts`, `lib/store/types.ts`, `lib/store/local.ts`, `lib/store/firebase.ts`, `lib/store/hybrid.ts`, `components/providers/auth.tsx`, `components/providers/cart.tsx`, `database.rules.json`

**Interfaces:**
* Produces: `DataStore { mode(): 'firebase'|'local'; getUser(): Promise<User|null>; onUser(cb): () => void; signUp(name, email, pw); signIn(email, pw); signOut(); getLibrary(uid): Promise<Purchase[]>; addPurchases(uid, ids: string[], orderId): Promise<void>; getListings(): Promise<Product[]>; createListing(uid, draft): Promise<Product>; getReviews(productId): Promise<Review[]>; addReview(productId, review) }`. `store` singleton from `lib/store/hybrid.ts`.
* Produces: `useAuth() => { user, loading, mode, signIn, signUp, signOut }`, `useCart() => { lines, add, remove, clear, count }`.

- [ ] Hybrid wraps each call: try firebase, on error mark local and retry on local. Local auth stores hashed-free demo users in localStorage (demo only, documented).
- [ ] Rules file: `/cryptic/users/$uid` and `/cryptic/library/$uid` read/write only by that uid, `/cryptic/listings` and `/cryptic/reviews` public read, auth write.
- [ ] `npx tsc --noEmit` passes. Commit.

### Task 3: Layout shell and Home

**Files:** `components/site/header.tsx`, `components/site/footer.tsx`, `components/ui/*` (button, badge, product-card, section-heading, glow), `app/page.tsx`, `app/not-found.tsx`

- [ ] Header with nav, search, cart count, auth menu, mobile menu. Footer.
- [ ] Home: hero, featured, categories, top creators, stats, testimonials, FAQ, creator CTA.
- [ ] `npx next build` passes. Commit.

### Task 4: Explore, product, creator pages and products API

**Files:** `app/explore/page.tsx`, `app/product/[slug]/page.tsx`, `app/creators/[handle]/page.tsx`, `app/api/products/route.ts`, `components/product/*`

- [ ] Explore reads URL params into `SearchQuery`, shows empty state. Product and creator pages call `notFound()` for unknown keys and use `generateStaticParams`. Product page merges reviews from `store`.
- [ ] `GET /api/products?q=&category=&sort=` returns `{ items: Product[] }`.
- [ ] Build passes. Commit.

### Task 5: Cart, checkout API, success

**Files:** `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/checkout/success/page.tsx`, `app/api/checkout/route.ts`, `lib/checkout.ts`, `tests/checkout.test.ts`

**Interfaces:** `validateCheckout(body: { productIds: string[]; card: string; code?: string }) => { ok: true, orderId, totals } | { ok: false, error }`.

- [ ] Tests: empty cart error, unknown id error, card `4000 0000 0000 0002` error "Card declined", `4242424242424242` with spaces ok.
- [ ] Implement, wire page to POST, then `store.addPurchases` and clear cart, redirect to success.
- [ ] Vitest and build pass. Commit.

### Task 6: Auth pages and dashboard

**Files:** `app/login/page.tsx`, `app/signup/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/learn/[slug]/page.tsx`, `app/dashboard/creator/page.tsx`, `app/dashboard/creator/new/page.tsx`, `app/sell/page.tsx`

- [ ] Dashboard redirects to `/login?next=` when no user. Library downloads a generated file (`SKILL.md` for skills, `.txt` otherwise) via Blob. Learn page lists lessons with a progress tick. Creator page shows a sales bar chart (inline SVG) and listings; New form calls `createListing`.
- [ ] Build passes. Commit.

### Task 7: Verify and deploy

- [ ] `npx vitest run`, `npx tsc --noEmit`, `npx next build` all pass.
- [ ] Playwright script: home loads, explore filter, product, add to cart, checkout with 4242, success, signup, dashboard library shows item. Screenshot at 1440 and 375 widths.
- [ ] Push branch, deploy to Vercel, check the deployed URL returns 200.
