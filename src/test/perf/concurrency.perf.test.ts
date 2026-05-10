import { describe, it, expect, vi, beforeEach } from "vitest";
import { benchmark } from "./benchmark";
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

describe("Concurrency & Load Tests", () => {
  beforeEach(() => {
    mockRedis.reset();
    vi.clearAllMocks();
  });

  it("should handle 100 concurrent search requests", async () => {
    vi.mocked(getCache).mockResolvedValue(mockSearchResult);
    vi.mocked(setCache).mockResolvedValue();

    const result = await benchmark(
      "Load Test: 100 Concurrent Searches",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 100, concurrency: 100, warmupIterations: 5 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(20);
  });

  it("should handle 200 concurrent search requests", async () => {
    vi.mocked(getCache).mockResolvedValue(mockSearchResult);
    vi.mocked(setCache).mockResolvedValue();

    const result = await benchmark(
      "Load Test: 200 Concurrent Searches",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 200, concurrency: 200, warmupIterations: 5 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(20);
  });

  it("should handle mixed workload: search + cache + AI", async () => {
    let callCount = 0;

    vi.mocked(getCache).mockImplementation(async () => {
      callCount++;
      return callCount % 3 === 0 ? null : mockSearchResult;
    });
    vi.mocked(setCache).mockResolvedValue();
    mockMeiliIndex.search.mockResolvedValue({
      hits: mockSearchResult.results,
      estimatedTotalHits: 100,
    });

    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 30));
      return {
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
      };
    });

    const result = await benchmark(
      "Load Test: Mixed Workload",
      async () => {
        const tasks = [];
        for (let taskIdx = 0; taskIdx < 5; taskIdx++) {
          tasks.push(searchRepositories("react", {}, { page: 1, perPage: 20 }));
        }
        const results = await Promise.all(tasks);
        expect(results[0].total).toBe(100);
      },
      { iterations: 50, concurrency: 50, warmupIterations: 3 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(5);
  });

  it("should sustain load over time (stress test)", async () => {
    vi.mocked(getCache).mockResolvedValue(mockSearchResult);
    vi.mocked(setCache).mockResolvedValue();

    const result = await benchmark(
      "Stress Test: Sustained Load",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 500, concurrency: 50, warmupIterations: 10, maxDuration: 15000 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.iterations).toBeGreaterThanOrEqual(400);
  });

  it("should handle burst traffic (spike test)", async () => {
    vi.mocked(getCache).mockResolvedValue(mockSearchResult);
    vi.mocked(setCache).mockResolvedValue();

    const result = await benchmark(
      "Spike Test: Burst Traffic",
      async () => {
        const res = await searchRepositories("react", {}, { page: 1, perPage: 20 });
        expect(res.total).toBe(100);
      },
      { iterations: 50, concurrency: 50, warmupIterations: 0, maxDuration: 5000 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
  });
});
