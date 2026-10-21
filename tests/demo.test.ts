import { describe, expect, it } from "vitest";
import { demoCredentials } from "@/lib/demo";
import { memoryStorage } from "@/lib/store/local";

describe("demoCredentials", () => {
  it("makes unique creds per browser and keeps them stable", () => {
    const a = memoryStorage();
    const first = demoCredentials(a);
    expect(demoCredentials(a)).toEqual(first);
    expect(first.email).toMatch(/^demo-[a-z0-9]{10,}@cryptic\.dev$/);
    expect(first.password.length).toBeGreaterThanOrEqual(16);
    expect(demoCredentials(memoryStorage()).email).not.toBe(first.email);
  });

  it("replaces junk in storage", () => {
    const s = memoryStorage();
    s.setItem("cryptic:demo", "{nope");
    expect(demoCredentials(s).email).toMatch(/^demo-/);
  });
});
