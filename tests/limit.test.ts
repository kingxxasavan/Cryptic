import { describe, expect, it } from "vitest";
import { limiter, clientIp } from "@/lib/server/limit";

describe("limiter", () => {
  it("lets each address make its daily number of AI requests, then says when they come back", () => {
    const take = limiter(3);
    const day = Date.UTC(2026, 10, 24, 10);
    expect(take("1.2.3.4", day)).toEqual({ ok: true, left: 2 });
    take("1.2.3.4", day); take("1.2.3.4", day);
    const r = take("1.2.3.4", day);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/3 AI requests/);
    expect(take("5.6.7.8", day).ok).toBe(true);                       // someone else is unaffected
    expect(take("1.2.3.4", Date.UTC(2026, 10, 25, 0, 1)).ok).toBe(true); // a new day
  });
  it("the address comes from the proxy headers", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "8.8.8.8" } }))).toBe("8.8.8.8");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
