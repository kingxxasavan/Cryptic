// Models wrap JSON in prose, code fences and <think> blocks, and leave
// trailing commas. This finds the first complete object and reads it.

function stripComments(s: string): string {
  let out = "", inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { out += c; if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && s[i + 1] === "*") { i += 2; while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  return out;
}

function removeTrailingCommas(s: string): string {
  let out = "", inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { out += c; if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === ",") { let j = i + 1; while (j < s.length && /\s/.test(s[j])) j++; if (s[j] === "}" || s[j] === "]") continue; }
    out += c;
  }
  return out;
}

/** The end index of the balanced object starting at `start`, or -1. */
function objectEnd(s: string, start: number): number {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

export function extractJson(text: string): unknown | null {
  const body = String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/i, "");
  for (let start = body.indexOf("{"); start !== -1; start = body.indexOf("{", start + 1)) {
    const end = objectEnd(body, start);
    if (end === -1) return null;
    const raw = body.slice(start, end + 1);
    try { return JSON.parse(raw); } catch { /* try a cleaned copy */ }
    try { return JSON.parse(removeTrailingCommas(stripComments(raw))); } catch { /* keep looking */ }
  }
  return null;
}
