import { describe, expect, it } from "vitest";
import { sanitizeListing, sanitizeReview } from "@/lib/store/sanitize";
import { productFromDraft } from "@/lib/store/listing";

const good = productFromDraft("fbuid1234567890", "Ada", {
  title: "Good Skill",
  tagline: "Does a thing",
  description: "A long enough description of the thing.",
  category: "claude-skills",
  priceCents: 1500,
  tags: ["a", "b"],
});

describe("sanitizeListing", () => {
  it("keeps a well formed listing", () => {
    expect(sanitizeListing(good.id, { ...good, ownerUid: "fbuid1234567890" })).toEqual(good);
  });

  it("drops records whose id doesn't match their key (listing hijack)", () => {
    expect(sanitizeListing("u_other", good)).toBeNull();
  });

  it("drops records with missing or wrong typed core fields", () => {
    expect(sanitizeListing(good.id, { ...good, createdAt: 5 })).toBeNull();
    expect(sanitizeListing(good.id, { ...good, title: undefined })).toBeNull();
    expect(sanitizeListing(good.id, { ...good, priceCents: "free" })).toBeNull();
    expect(sanitizeListing(good.id, { ...good, category: "malware" })).toBeNull();
    expect(sanitizeListing(good.id, null)).toBeNull();
  });

  it("refuses to impersonate seeded creators", () => {
    expect(sanitizeListing(good.id, { ...good, creatorHandle: "mira" })).toBeNull();
  });

  it("coerces tags and contents that aren't arrays and clamps the accent", () => {
    const r = sanitizeListing(good.id, { ...good, tags: { a: "b" }, contents: { x: 1 }, accent: "0 0% 0%), url(https://x/t)" })!;
    expect(r.tags).toEqual(["b"]); // RTDB can hand arrays back as keyed objects, values are kept
    expect(r.contents).toEqual([{ title: "Main file", detail: "Delivered after purchase" }]);
    expect(typeof r.accent).toBe("number");
  });

  it("resets stats a creator could fake", () => {
    const r = sanitizeListing(good.id, { ...good, rating: 5, sales: 99999, reviewCount: 500, featured: true })!;
    expect([r.rating, r.sales, r.reviewCount, r.featured]).toEqual([0, 0, 0, undefined]);
  });
});

describe("sanitizeReview", () => {
  const review = { id: "r_1", productId: "p001", author: "Ada", rating: 5, body: "Great", createdAt: "2026-10-21T00:00:00Z", uid: "x" };

  it("keeps a good review and strips extra fields", () => {
    expect(sanitizeReview("r_1", "p001", review)).toEqual({ id: "r_1", productId: "p001", author: "Ada", rating: 5, body: "Great", createdAt: "2026-10-21T00:00:00Z" });
  });

  it("drops broken reviews", () => {
    expect(sanitizeReview("r_1", "p001", { ...review, author: undefined })).toBeNull();
    expect(sanitizeReview("r_1", "p001", { ...review, rating: 9 })).toBeNull();
    expect(sanitizeReview("r_2", "p001", review)).toBeNull();
    expect(sanitizeReview("r_1", "p002", review)).toBeNull();
    expect(sanitizeReview("r_1", "p001", "lol")).toBeNull();
  });
});
