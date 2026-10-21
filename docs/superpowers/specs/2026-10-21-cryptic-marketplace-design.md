# Cryptic: AI marketplace design

## Goal

A premium, dark luxury marketplace where creators sell AI assets and buyers browse, buy and use them. Categories: Claude Skills, GPTs (ChatGPT skills), Prompt Packs, Courses (AI usage, prompting), Context Engineering, Agents and MCP. Hosted on Vercel.

## Constraints (from the user)

* Fully working demo. No real money. Checkout is simulated (Stripe style form, test card `4242 4242 4242 4242`).
* Works on Vercel right away with no secret keys to set up.
* Use the user's Firebase project `chat-f6735` (web config is public client config, safe to ship) for auth and the Realtime Database at `https://chat-f6735-default-rtdb.firebaseio.com/`.
* Dark luxury look (deep black, soft glow, sharp type).

## Assumptions

* The Firebase project may not have Email/Password auth enabled or open RTDB rules yet. The app must never break because of that: every Firebase call falls back to browser storage (localStorage) and the UI shows which mode is active.
* All Cryptic data lives under `/cryptic` in the RTDB so it can't collide with anything else in that project.
* The seeded catalog (about 40 products, 10 creators) lives in code so pages render fast and are crawlable. Creator made listings are stored in Firebase (or locally) and merged in on the client.

## Architecture

* Next.js 15 App Router, TypeScript, Tailwind CSS v4, Framer Motion for motion.
* `lib/catalog.ts`: seeded products and creators plus pure helpers (search, filter, sort, lookups). Unit tested.
* `lib/cart.ts`: pure cart math (totals, fees, discount codes). Unit tested.
* `lib/firebase.ts`: lazy client init from the given config.
* `lib/store/`: one `DataStore` interface (`getUser`, `signIn`, `signUp`, `signOut`, `getLibrary`, `addPurchases`, `getListings`, `createListing`, `getReviews`, `addReview`) with two impls, `firebaseStore` and `localStore`. A `hybridStore` tries Firebase and drops to local on failure.
* React context providers: `AuthProvider`, `CartProvider` (cart always in localStorage).
* API route handlers: `GET /api/products` (search/filter on the server), `POST /api/checkout` (validates the card format and cart, returns a fake order id). Server side validation keeps it honest full stack.

## Pages

* `/` Home: hero, featured drops, category grid, top creators, stats, testimonials, FAQ, creator CTA.
* `/explore` search, category chips, price range, sort (trending, newest, price, rating). URL query state.
* `/product/[slug]` preview of contents (skill file excerpt or lesson list), reviews, creator card, buy / add to cart.
* `/creators/[handle]` profile with their products.
* `/cart`, `/checkout`, `/checkout/success`.
* `/login`, `/signup`.
* `/dashboard` library (owned items, download the skill file as a real generated file), `/dashboard/learn/[slug]` lesson player for courses, `/dashboard/creator` sales chart and listings, `/dashboard/creator/new` listing form.
* `/sell` creator pitch page.
* Custom 404.

## Error handling

* Firebase errors are caught in `hybridStore`, logged once, and the store switches to local mode for the session.
* Checkout errors (bad card, empty cart) come back from the API as 400s with readable messages shown inline.
* Protected dashboard pages redirect to `/login` on the client when no user.

## Testing

* Vitest unit tests for catalog helpers and cart math.
* `tsc --noEmit`, `next lint`, `next build`.
* Playwright click through on the built app: home, explore filter, product, add to cart, checkout, library.

## Out of scope

Real payments, payouts, file uploads, email, admin moderation.
