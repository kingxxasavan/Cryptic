// With no accounts, the AI is limited per network address: a daily number of
// requests, so a shared link can't run up the NVIDIA bill. It's counted in
// the server's memory, which is best effort (each server instance counts on
// its own), and that's the trade for not asking anyone to sign in.

export const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 40;

export function limiter(max: number) {
  const counts = new Map<string, number>();
  let day = "";
  return (ip: string, now = Date.now()): { ok: true; left: number } | { ok: false; error: string } => {
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== day) { counts.clear(); day = today; }
    const used = counts.get(ip) || 0;
    if (used >= max) return { ok: false, error: `That's today's ${max} AI requests from this network. They come back tomorrow (UTC).` };
    counts.set(ip, used + 1);
    if (counts.size > 50000) counts.clear();
    return { ok: true, left: max - used - 1 };
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return (req.headers.get("x-real-ip") || "unknown").trim();
}
