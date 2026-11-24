// Web research for designs: search, then read the best pages. Tavily when the
// deployment has a key (dependable); otherwise free sources, which can turn
// servers away now and then, so every step is allowed to fail.
import "server-only";

export interface Hit { title: string; url: string; snippet: string }
export interface Page { title: string; url: string; text: string }

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const PRIVATE = /^(localhost$|127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i;

function decode(t: string) {
  return t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}
const strip = (t: string) => decode(t.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export function htmlToText(html: string): string {
  return decode(html
    .replace(/<!--[\s\S]*?-->/g, " ").replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<(script|style|noscript|svg|nav|footer|form|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

async function get(url: string, ms = 8000): Promise<Response | null> {
  try { return await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.5", "accept-language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(ms), redirect: "follow" }); }
  catch { return null; }
}

async function tavily(q: string): Promise<Hit[]> {
  const k = (process.env.TAVILY_API_KEY || "").trim();
  if (!k) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ api_key: k, query: q, max_results: 6, search_depth: "basic" }), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: { title?: string; url: string; content?: string }[] };
    return (data.results || []).map((r) => ({ title: r.title || r.url, url: r.url, snippet: (r.content || "").slice(0, 500) }));
  } catch { return []; }
}

async function duckduckgo(q: string): Promise<Hit[]> {
  const res = await get("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q));
  if (!res || res.status !== 200) return [];
  const html = await res.text();
  const out: Hit[] = [];
  for (const m of html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>)?/gi)) {
    let href = decode(m[1]);
    const w = /[?&]uddg=([^&]+)/.exec(href);
    if (w) try { href = decodeURIComponent(w[1]); } catch { continue; }
    if (!/^https?:\/\//.test(href)) continue;
    out.push({ title: strip(m[2]), url: href, snippet: strip(m[3] || "") });
    if (out.length >= 6) break;
  }
  return out;
}

async function bing(q: string): Promise<Hit[]> {
  const res = await get("https://www.bing.com/search?q=" + encodeURIComponent(q) + "&setlang=en-US&cc=US");
  if (!res || res.status !== 200) return [];
  const html = await res.text();
  const out: Hit[] = [];
  for (const chunk of html.split(/<li class="b_algo"/i).slice(1)) {
    const a = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(chunk);
    if (!a) continue;
    let href = decode(a[1]);
    const u = /[?&]u=a1([^&]+)/.exec(href);
    if (u) try { href = Buffer.from(u[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { continue; }
    if (!/^https?:\/\//.test(href) || /bing\.com/.test(href)) continue;
    const p = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(chunk);
    out.push({ title: strip(a[2]), url: href, snippet: p ? strip(p[1]) : "" });
    if (out.length >= 6) break;
  }
  return out;
}

async function wikipedia(q: string): Promise<Hit[]> {
  const res = await get("https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=" + encodeURIComponent(q));
  if (!res || !res.ok) return [];
  try {
    const data = (await res.json()) as { query?: { search?: { title: string; snippet: string }[] } };
    return (data.query?.search || []).map((h) => ({ title: h.title, url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(h.title.replace(/ /g, "_")), snippet: strip(h.snippet) }));
  } catch { return []; }
}

export async function search(q: string): Promise<Hit[]> {
  const keyed = await tavily(q);
  if (keyed.length) return keyed;
  const lists = await Promise.all([duckduckgo(q), bing(q), wikipedia(q)]);
  const seen = new Set<string>(), out: Hit[] = [];
  for (let i = 0; i < 6; i++) for (const l of lists) { const h = l[i]; if (h && !seen.has(h.url)) { seen.add(h.url); out.push(h); } }
  return out.slice(0, 8);
}

export async function readPage(url: string): Promise<Page | null> {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || PRIVATE.test(u.hostname)) return null;
  const res = await get(u.href, 9000);
  if (!res || !res.ok || !/text\/html|text\/plain/.test(res.headers.get("content-type") || "")) return null;
  const html = (await res.text()).slice(0, 1_500_000);
  const title = strip(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html)?.[1] || u.hostname);
  return { title, url: u.href, text: htmlToText(html).slice(0, 12000) };
}

/** Search every query, read the best few pages; whatever answers in time. */
export async function research(queries: string[], onStep?: (s: string) => void): Promise<{ hits: Hit[]; pages: Page[] }> {
  const hits: Hit[] = [];
  const results = await Promise.all(queries.slice(0, 6).map(async (q) => { onStep?.(`Searching “${q}”`); return search(q); }));
  const seen = new Set<string>();
  results.forEach((list) => list.forEach((h) => { if (!seen.has(h.url)) { seen.add(h.url); hits.push(h); } }));
  const best = results.flatMap((l) => l.slice(0, 2)).filter((h, i, a) => a.findIndex((x) => x.url === h.url) === i).slice(0, 6);
  if (best.length) onStep?.(`Reading ${best.length} pages`);
  const pages = (await Promise.all(best.map((h) => readPage(h.url)))).filter((p): p is Page => !!p && p.text.length > 200);
  // Snippets count too: a page that wouldn't load still said something.
  for (const h of hits) if (!pages.some((p) => p.url === h.url) && h.snippet) pages.push({ title: h.title, url: h.url, text: h.snippet });
  return { hits, pages: pages.slice(0, 12) };
}
