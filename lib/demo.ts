type KV = Pick<Storage, "getItem" | "setItem">;
const KEY = "cryptic:demo";

const rand = (n: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
};

/** a demo login unique to this browser, so one visitor can't break the demo for everyone */
export function demoCredentials(storage: KV): { name: string; email: string; password: string } {
  try {
    const saved = JSON.parse(storage.getItem(KEY) ?? "null");
    if (typeof saved?.email === "string" && typeof saved?.password === "string") return { name: "Demo Buyer", ...saved };
  } catch {}
  const creds = { email: `demo-${rand(12)}@cryptic.dev`, password: rand(20) };
  try {
    storage.setItem(KEY, JSON.stringify(creds));
  } catch {}
  return { name: "Demo Buyer", ...creds };
}
