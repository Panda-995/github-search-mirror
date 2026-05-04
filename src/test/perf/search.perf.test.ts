import { describe, it, expect, vi, beforeEach } from "vitest";
import { benchmark, assertPerformance } from "./benchmark";
import { searchRepositories } from "@/server/search.actions";
import { getCache, setCache } from "@/lib/cache";
import { mockRedis } from "../mocks/redis";
import type { SearchResult } from "@/types";

const { mockMeiliIndex } = vi.hoisted(() => ({
  mockMeiliIndex: {
    search: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock("@/lib/cache");
vi.mock("meilisearch", () => ({
  Meilisearch: vi.fn(function () {
    return {
      index: vi.fn(() => mockMeiliIndex),
    };
  }),
}));

const mockSearchResult: SearchResult = {
  total: 100,
  page: 1,
  per_page: 20,
  results: Array.from({ length: 20 }, (_, i) => ({
    full_name: `owner/repo-${i}`,
    name: `repo-${i}`,
    owner: `owner`,
    description: "A test repository",
    stars: 1000 + i,
    forks: 100 + i,
    open_issues: 10 + i,
    watchers: 1000 + i,
    language: "TypeScript",
    topics: ["react", "nextjs"],
    license: "MIT",
    created_at: "2024-01-01T00:00:00Z",
    pushed_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    homepage: "https://example.com",
    html_url: `https://github.com/owner/repo-${i}`,
  })),
  facets: { language: [], license: [], topic: [] },
};

describe("Search Performance", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("cache hit should respond within 500ms", async () => {
    vi.mocked(getCache).mockResolvedValue(mockSearchResult);
    vi.mocked(setCache).mockResolvedValue();

    const result = await benchmark(
      "Search (Cache Hit)",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 50, warmupIterations: 5 }
    );

    console.log(result);
    expect(assertPerformance(result, 500, "avgTime")).toBe(true);
    expect(assertPerformance(result, 800, "p95Time")).toBe(true);
  });

  it("cache miss with Meilisearch should respond within 2s", async () => {
    vi.mocked(getCache).mockResolvedValue(null);
    vi.mocked(setCache).mockResolvedValue();

    const meiliHits = mockSearchResult.results.map((r) => ({
      full_name: r.full_name,
      name: r.name,
      owner: r.owner,
      description: r.description,
      stars: r.stars,
      forks: r.forks,
      open_issues: r.open_issues,
      watchers: r.watchers,
      language: r.language,
      topics: r.topics,
      license: r.license,
      created_at: r.created_at,
      pushed_at: r.pushed_at,
      updated_at: r.updated_at,
      homepage: r.homepage,
      html_url: r.html_url,
    }));

    mockMeiliIndex.search.mockResolvedValue({
      hits: meiliHits,
      estimatedTotalHits: 100,
    });

    const result = await benchmark(
      "Search (Meilisearch)",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBeGreaterThanOrEqual(0);
      },
      { iterations: 20, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  }, 10000);

  it("cache miss with GitHub API fallback should respond within 2s", async () => {
    vi.mocked(getCache).mockResolvedValue(null);
    vi.mocked(setCache).mockResolvedValue();
    mockMeiliIndex.search.mockRejectedValue(new Error("Meilisearch unavailable"));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_count: 100,
        items: mockSearchResult.results.map((r) => ({
          full_name: r.full_name,
          name: r.name,
          owner: { login: r.owner, avatar_url: "" },
          description: r.description,
          stargazers_count: r.stars,
          forks_count: r.forks,
          open_issues_count: r.open_issues,
          watchers_count: r.watchers,
          language: r.language,
          topics: r.topics,
          license: r.license ? { name: r.license } : null,
          created_at: r.created_at,
          pushed_at: r.pushed_at,
          updated_at: r.updated_at,
          homepage: r.homepage,
          html_url: r.html_url,
        })),
      }),
    });

    const result = await benchmark(
      "Search (GitHub API Fallback)",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 20, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  });

  it("should handle 100+ concurrent search requests", async () => {
    vi.mocked(getCache).mockImplementation(async (key: string) => {
      if (key.includes("react")) return mockSearchResult;
      return null;
    });
    vi.mocked(setCache).mockResolvedValue();
    mockMeiliIndex.search.mockResolvedValue({
      hits: mockSearchResult.results,
      estimatedTotalHits: 100,
    });

    const result = await benchmark(
      "Search (Concurrent 100)",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 100, concurrency: 100, warmupIterations: 5 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(10);
  });
});
