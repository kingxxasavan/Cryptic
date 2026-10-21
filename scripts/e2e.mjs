// end to end click through against a running server
// usage: node scripts/e2e.mjs [baseUrl] [--offline-firebase]
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const offline = process.argv.includes("--offline-firebase");
const shots = process.env.SHOTS_DIR;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
if (offline) await ctx.route(/googleapis|firebaseio|gstatic|googletagmanager|google-analytics/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

let step = 0;
async function check(name, fn) {
  step++;
  try {
    await fn();
    console.log(`  ✓ ${step}. ${name}`);
  } catch (e) {
    console.log(`  ✗ ${step}. ${name}\n      ${String(e.message).split("\n")[0]}`);
    if (shots) await page.screenshot({ path: `${shots}/fail-${step}.png` });
    process.exitCode = 1;
  }
}
const go = (p) => page.goto(base + p, { waitUntil: "load" });
const email = `e2e+${Date.now()}@cryptic.dev`;

await check("home renders the hero", async () => {
  await go("/");
  await page.getByRole("heading", { level: 1 }).filter({ hasText: "The marketplace" }).waitFor();
});

await check("explore filters by category", async () => {
  await go("/explore?category=courses");
  await page.getByText("7 results").waitFor();
});

await check("search with no matches shows the empty state", async () => {
  await page.fill("#explore-q", "zzzqqq🦄");
  await page.getByText("Nothing yet").waitFor({ timeout: 5000 });
});

await check("unknown product is a 404", async () => {
  const res = await go("/product/not-a-real-thing");
  if (res.status() !== 404) throw new Error(`status ${res.status()}`);
});

await check("add to cart updates the badge", async () => {
  await go("/product/contract-redliner-skill");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: "Cart, 1 items" }).waitFor();
});

await check("checkout sends guests to login", async () => {
  await go("/checkout");
  await page.waitForURL(/\/login\?next=%2Fcheckout|\/login\?next=\/checkout/);
});

await check("sign up and land back on checkout", async () => {
  await go("/signup?next=/checkout");
  await page.fill("#name", "E2E Tester");
  await page.fill("#email", email);
  await page.fill("#password", "secret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/checkout$/, { timeout: 20000 });
});

await check("declined card shows an error", async () => {
  await page.fill("#cc-name", "E2E");
  await page.fill("#cc-number", "4000000000000002");
  await page.fill("#cc-exp", "1230");
  await page.fill("#cc-cvc", "123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByRole("alert").filter({ hasText: "Card declined." }).waitFor();
});

await check("promo code and test card complete the order", async () => {
  await page.fill("#promo", "CRYPTIC10");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("button", { name: "Pay $71.10" }).waitFor();
  await page.getByRole("button", { name: "Fill test card" }).click();
  await page.getByRole("button", { name: "Pay $71.10" }).click();
  await page.waitForURL(/\/checkout\/success/, { timeout: 20000 });
  await page.getByRole("heading", { name: "You're all set." }).waitFor();
});

await check("library shows the purchase and downloads a file", async () => {
  await go("/dashboard");
  await page.getByText("Contract Redliner Skill").waitFor({ timeout: 20000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).first().click()]);
  if (dl.suggestedFilename() !== "contract-redliner-skill-SKILL.md") throw new Error(dl.suggestedFilename());
});

await check("buy a course and complete a lesson", async () => {
  await go("/product/prompt-engineering-masterclass");
  await page.getByRole("button", { name: "Buy now" }).click();
  await page.waitForURL(/\/checkout$/);
  await page.getByRole("button", { name: "Fill test card" }).click();
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.waitForURL(/\/checkout\/success/, { timeout: 20000 });
  await go("/dashboard/learn/prompt-engineering-masterclass");
  await page.getByRole("button", { name: "Complete & continue" }).click({ timeout: 20000 });
  await page.getByText("13% complete").waitFor();
});

await check("publish a listing and find it in explore", async () => {
  await go("/dashboard/creator/new");
  await page.fill("#title", "E2E Sales Call Skill");
  await page.fill("#tagline", "Prep for any sales call in two minutes");
  await page.fill("#description", "A Claude Skill that researches the account and writes a call plan.");
  await page.fill("#tags", "sales, calls, prep");
  await page.getByRole("button", { name: "Publish listing" }).click();
  await page.waitForURL(/\/listing\/u_/, { timeout: 20000 });
  await page.getByRole("heading", { name: "E2E Sales Call Skill" }).waitFor({ timeout: 20000 });
  await go("/explore?q=e2e+sales");
  await page.getByText("E2E Sales Call Skill").waitFor({ timeout: 20000 });
  await page.getByText("1 result for").waitFor({ timeout: 20000 });
  if (await page.getByText("Nothing yet").count()) throw new Error("empty state shown next to a result");
});

await check("log out and log back in", async () => {
  await go("/");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Log in" }).first().waitFor();
  await go("/login");
  await page.fill("#email", email);
  await page.fill("#password", "secret123");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 20000 });
  await page.getByText("Contract Redliner Skill").waitFor({ timeout: 20000 });
});

const real = errors.filter((e) => !/firebase|googleapis|network|Failed to fetch/i.test(e));
await check("no uncaught page errors", async () => {
  if (real.length) throw new Error(real.join(" | "));
});

await browser.close();
console.log(process.exitCode ? "\nE2E FAILED" : "\nE2E passed");
