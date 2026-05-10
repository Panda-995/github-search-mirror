import { describe, expect, it } from "vitest";
import {
  parseSearchOrder,
  parseSearchPage,
  parseSearchPerPage,
  parseSearchSort,
  sanitizeQualifierValue,
} from "@/lib/search-params";

describe("search parameter guards", () => {
  it("clamps pagination", () => {
    expect(parseSearchPage("-10")).toBe(1);
    expect(parseSearchPerPage("999")).toBe(50);
  });

  it("drops invalid sort and order values", () => {
    expect(parseSearchSort("stars")).toBe("stars");
    expect(parseSearchSort("stars;drop")).toBeUndefined();
    expect(parseSearchOrder("desc")).toBe("desc");
    expect(parseSearchOrder("sideways")).toBeUndefined();
  });

  it("keeps qualifier values conservative", () => {
    expect(sanitizeQualifierValue("TypeScript")).toBe("TypeScript");
    expect(sanitizeQualifierValue("TypeScript stars:>0")).toBeUndefined();
  });
});
