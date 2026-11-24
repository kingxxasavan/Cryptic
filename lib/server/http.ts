// Small helpers shared by the API routes.
import "server-only";
import { DAILY_LIMIT, clientIp, limiter } from "./limit";

const take = limiter(DAILY_LIMIT);

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

/** Within today's limit for this network, or the response to send instead. */
export async function gate(req: Request): Promise<{ left: number } | { res: Response }> {
  const r = take(clientIp(req));
  if (!r.ok) return { res: json({ error: r.error }, 429) };
  return { left: r.left };
}

/** A response that streams one JSON object per line, with a heartbeat so nothing in between gives up. */
export function ndjson(run: (emit: (line: Record<string, unknown>) => void) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const emit = (line: Record<string, unknown>) => { if (open) try { controller.enqueue(enc.encode(JSON.stringify(line) + "\n")); } catch { open = false; } };
      const beat = setInterval(() => emit({ hb: 1 }), 5000);
      try { await run(emit); }
      catch (e) { emit({ error: (e as Error).message || "Something went wrong." }); }
      finally { clearInterval(beat); open = false; try { controller.close(); } catch { /* closed */ } }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
