import { describe, expect, it } from "vitest";
import { buildSearchRequest } from "@/lib/search-request";

describe("buildSearchRequest", () => {
  it("normalizes query params consistently for API and page searches", () => {
    const request = buildSearchRequest(
      {
        q: " react language:typescript sort:stars ",
        language: "Go",
        stars: ">100",
        forks: "<50",
        updated: ">30d",
        order: "asc",
        page: "2",
        per_page: "999",
      },
      { includePerPage: true }
    );

    expect(request.normalizedQuery).toBe("react language:typescript sort:stars");
    expect(request.searchQuery).toBe("react");
    expect(request.filters.language).toEqual(["Go"]);
    expect(request.filters.stars_min).toBe(100);
    expect(request.filters.forks_max).toBe(50);
    expect(request.filters.pushed_after).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(request.sort).toBe("stars");
    expect(request.order).toBe("asc");
    expect(request.page).toBe(2);
    expect(request.perPage).toBe(50);
  });
});
