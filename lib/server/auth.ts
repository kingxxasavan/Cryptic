// Who's asking: a Firebase ID token checked with Google's identity service
// (no service account needed), and a daily limit kept in the database with
// the member's own token. The rules only let that counter go up by one, so
// nobody can reset their own count.
import "server-only";
import { firebaseConfig } from "@/lib/firebase";

export interface User { uid: string; email: string; verified: boolean; token: string }

export async function verify(req: Request): Promise<User | null> {
  const h = req.headers.get("authorization") || "";
  const token = /^Bearer (.+)$/.exec(h)?.[1];
  if (!token || token.length > 4000) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: { localId: string; email?: string; emailVerified?: boolean }[] };
    const u = data.users?.[0];
    return u ? { uid: u.localId, email: (u.email || "").toLowerCase(), verified: !!u.emailVerified, token } : null;
  } catch { return null; }
}

export const DAILY_LIMIT = 40;
export const isOwner = (u: User) => !!process.env.OWNER_EMAIL && u.verified && u.email === process.env.OWNER_EMAIL.trim().toLowerCase();

const day = () => new Date().toISOString().slice(0, 10);

/** Counts one AI request. Returns how many are left, or an error when the day's are used up. */
export async function spend(u: User): Promise<{ left: number } | { error: string }> {
  if (isOwner(u)) return { left: Infinity };
  const url = `${firebaseConfig.databaseURL}/parts/usage/${u.uid}/${day()}.json?auth=${encodeURIComponent(u.token)}`;
  try {
    const now = Number(await (await fetch(url, { signal: AbortSignal.timeout(6000) })).json()) || 0;
    if (now >= DAILY_LIMIT) return { error: `You've used today's ${DAILY_LIMIT} AI requests. They come back tomorrow (UTC).` };
    const put = await fetch(url, { method: "PUT", body: JSON.stringify(now + 1), signal: AbortSignal.timeout(6000) });
    if (!put.ok) return { error: "Couldn't count this request (the database rules may need publishing)." };
    return { left: DAILY_LIMIT - now - 1 };
  } catch {
    return { error: "Couldn't reach the database to count this request." };
  }
}
