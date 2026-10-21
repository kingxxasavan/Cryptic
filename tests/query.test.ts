import { describe, expect, it } from "vitest";
import { parseSearchParams, toSearchString } from "@/lib/query";

describe("parseSearchParams", () => {
  it("reads valid params, prices are dollars in the url and cents inside", () => {
    expect(parseSearchParams({ q: " rag ", category: "courses", sort: "rating", min: "10", max: "50" })).toEqual({
      q: "rag",
      category: "courses",
      sort: "rating",
      min: 1000,
      max: 5000,
    });
  });

  it("drops junk values instead of throwing", () => {
    expect(parseSearchParams({ category: "nope", sort: "random", min: "abc", max: "-5" })).toEqual({ sort: "trending" });
  });

  it("takes the first value when a param repeats", () => {
    expect(parseSearchParams({ category: ["gpts", "courses"] }).category).toBe("gpts");
  });

  it("defaults sort to trending and ignores empty q", () => {
    expect(parseSearchParams({ q: "   " })).toEqual({ sort: "trending" });
  });

  it("caps very long queries at 100 chars", () => {
    expect(parseSearchParams({ q: "a".repeat(500) }).q).toHaveLength(100);
  });
});

describe("toSearchString", () => {
  it("round trips and leaves out defaults", () => {
    expect(toSearchString({ q: "rag", category: "courses", sort: "trending", min: 1000 })).toBe("q=rag&category=courses&min=10");
    expect(toSearchString({ sort: "trending" })).toBe("");
  });
});
