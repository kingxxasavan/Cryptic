import { describe, expect, it } from "vitest";
import { getProduct } from "@/lib/catalog";
import { buildDownload } from "@/lib/download";
import { safeNext } from "@/lib/query";

describe("buildDownload", () => {
  it("gives Claude Skills a SKILL.md with the preview and contents", () => {
    const d = buildDownload(getProduct("contract-redliner-skill")!);
    expect(d.filename).toBe("contract-redliner-skill-SKILL.md");
    expect(d.mime).toBe("text/markdown");
    expect(d.content).toContain("name: contract-redliner");
    expect(d.content).toContain("playbook.template.md");
  });

  it("gives other products a markdown guide named after the slug", () => {
    const d = buildDownload(getProduct("the-founder-s-prompt-vault")!);
    expect(d.filename).toBe("the-founder-s-prompt-vault.md");
    expect(d.content).toContain("# The Founder's Prompt Vault");
  });
});

describe("safeNext", () => {
  it("allows local paths", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("/dashboard?open=p001")).toBe("/dashboard?open=p001");
  });

  it("blocks other sites and junk", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
  });
});
