import { describe, it, expect } from "vitest";
import { parseSearchQuery } from "@/lib/search-parser";

describe("parseSearchQuery", () => {
  it("should parse plain query without filters", () => {
    const result = parseSearchQuery("react router");
    expect(result.query).toBe("react router");
    expect(Object.keys(result.filters)).toHaveLength(0);
  });

  it("should parse language filter", () => {
    const result = parseSearchQuery("router language:typescript");
    expect(result.query).toBe("router");
    expect(result.filters.language).toEqual(["typescript"]);
  });

  it("should parse multiple languages", () => {
    const result = parseSearchQuery("framework language:typescript language:go");
    expect(result.filters.language).toEqual(["typescript", "go"]);
  });

  it("should parse stars filter with greater than", () => {
    const result = parseSearchQuery("react stars:>1000");
    expect(result.query).toBe("react");
    expect(result.filters.stars_min).toBe(1000);
  });

  it("should parse stars filter with less than", () => {
    const result = parseSearchQuery("react stars:<50000");
    expect(result.query).toBe("react");
    expect(result.filters.stars_max).toBe(50000);
  });

  it("should parse forks filter", () => {
    const result = parseSearchQuery("react forks:>100");
    expect(result.filters.forks_min).toBe(100);
  });

  it("should parse pushed date filter", () => {
    const result = parseSearchQuery("react pushed:>2024-01-01");
    expect(result.filters.pushed_after).toBe("2024-01-01");
  });

  it("should parse created date filter", () => {
    const result = parseSearchQuery("react created:>2023-01-01");
    expect(result.filters.created_after).toBe("2023-01-01");
  });

  it("should parse license filter", () => {
    const result = parseSearchQuery("react license:MIT");
    expect(result.filters.license).toEqual(["MIT"]);
  });

  it("should parse topic filter", () => {
    const result = parseSearchQuery("react topic:hooks");
    expect(result.filters.topic).toEqual(["hooks"]);
  });

  it("should parse user filter", () => {
    const result = parseSearchQuery("react user:facebook");
    expect(result.filters.user).toBe("facebook");
  });

  it("should parse org filter", () => {
    const result = parseSearchQuery("react org:vercel");
    expect(result.filters.org).toBe("vercel");
  });

  it("should parse sort option", () => {
    const result = parseSearchQuery("react sort:stars");
    expect(result.sort).toBe("stars");
  });

  it("should parse order option", () => {
    const result = parseSearchQuery("react order:asc");
    expect(result.order).toBe("asc");
  });

  it("should parse in:name filter", () => {
    const result = parseSearchQuery("react in:name");
    expect(result.filters.in).toEqual(["name"]);
  });

  it("should handle complex query with multiple filters", () => {
    const result = parseSearchQuery(
      "react router language:typescript stars:>1000 sort:stars order:desc"
    );
    expect(result.query).toBe("react router");
    expect(result.filters.language).toEqual(["typescript"]);
    expect(result.filters.stars_min).toBe(1000);
    expect(result.sort).toBe("stars");
    expect(result.order).toBe("desc");
  });

  it("should handle empty query", () => {
    const result = parseSearchQuery("");
    expect(result.query).toBe("");
  });
});
