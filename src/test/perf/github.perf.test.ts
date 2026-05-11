import { describe, it, expect, vi, beforeEach } from "vitest";
import { benchmark, assertPerformance, logBenchmarkResult } from "./benchmark";
import {
  clearGitHubCache,
  searchRepos,
  getRepo,
  getRepoReadme,
  getTrendingRepos,
} from "@/lib/github";

describe("GitHub API Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGitHubCache();
  });

  it("searchRepos should respond within 2s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return {
        ok: true,
        json: async () => ({
          total_count: 1000,
          items: Array.from({ length: 20 }, (_, i) => ({
            id: i,
            full_name: `owner/repo-${i}`,
            name: `repo-${i}`,
            owner: { login: "owner", avatar_url: "" },
            description: "Test repo",
            stargazers_count: 100,
            forks_count: 10,
            open_issues_count: 5,
            watchers_count: 100,
            language: "TypeScript",
            topics: [],
            license: null,
            created_at: "2024-01-01T00:00:00Z",
            pushed_at: "2024-06-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z",
            homepage: null,
            html_url: `https://github.com/owner/repo-${i}`,
          })),
        }),
      };
    });

    const result = await benchmark(
      "GitHub Search Repos",
      async () => {
        const res = await searchRepos("react", { page: 1, perPage: 20 });
        expect(res.total_count).toBe(1000);
      },
      { iterations: 20, warmupIterations: 2 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  }, 10000);

  it("getRepo should respond within 2s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 60));
      return {
        ok: true,
        json: async () => ({
          id: 1,
          full_name: "facebook/react",
          name: "react",
          owner: { login: "facebook", avatar_url: "" },
          description: "A JavaScript library",
          stargazers_count: 220000,
          forks_count: 45000,
          open_issues_count: 1000,
          watchers_count: 220000,
          language: "JavaScript",
          topics: ["frontend", "ui"],
          license: { name: "MIT" },
          created_at: "2013-05-24T00:00:00Z",
          pushed_at: "2024-06-01T00:00:00Z",
          updated_at: "2024-06-01T00:00:00Z",
          homepage: "https://react.dev",
          html_url: "https://github.com/facebook/react",
        }),
      };
    });

    const result = await benchmark(
      "GitHub Get Repo",
      async () => {
        const res = await getRepo("facebook", "react");
        expect(res.name).toBe("react");
      },
      { iterations: 20, warmupIterations: 2 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  }, 10000);

  it("getRepoReadme should respond within 2s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 70));
      return {
        ok: true,
        json: async () => ({
          content: Buffer.from("# React\n\nA JS library").toString("base64"),
          encoding: "base64",
        }),
      };
    });

    const result = await benchmark(
      "GitHub Get README",
      async () => {
        const res = await getRepoReadme("facebook", "react");
        expect(res).toContain("React");
      },
      { iterations: 20, warmupIterations: 2 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  }, 10000);

  it("getTrendingRepos should respond within 2s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 90));
      return {
        ok: true,
        json: async () => ({
          total_count: 100,
          items: Array.from({ length: 30 }, (_, i) => ({
            id: i,
            full_name: `owner/trending-${i}`,
            name: `trending-${i}`,
            owner: { login: "owner", avatar_url: "" },
            description: "Trending repo",
            stargazers_count: 500 + i,
            forks_count: 50,
            open_issues_count: 10,
            watchers_count: 500,
            language: "TypeScript",
            topics: ["trending"],
            license: null,
            created_at: "2024-05-01T00:00:00Z",
            pushed_at: "2024-06-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z",
            homepage: null,
            html_url: `https://github.com/owner/trending-${i}`,
          })),
        }),
      };
    });

    const result = await benchmark(
      "GitHub Trending Repos",
      async () => {
        const res = await getTrendingRepos("daily");
        expect(res.length).toBe(30);
      },
      { iterations: 15, warmupIterations: 2 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 2000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 3000, "p95Time")).toBe(true);
  }, 10000);

  it("should handle concurrent GitHub API requests", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 40));
      return {
        ok: true,
        json: async () => ({
          total_count: 100,
          items: Array.from({ length: 20 }, (_, i) => ({
            id: i,
            full_name: `owner/repo-${i}`,
            name: `repo-${i}`,
            owner: { login: "owner", avatar_url: "" },
            description: "Test",
            stargazers_count: 100,
            forks_count: 10,
            open_issues_count: 5,
            watchers_count: 100,
            language: "TypeScript",
            topics: [],
            license: null,
            created_at: "2024-01-01T00:00:00Z",
            pushed_at: "2024-06-01T00:00:00Z",
            updated_at: "2024-06-01T00:00:00Z",
            homepage: null,
            html_url: `https://github.com/owner/repo-${i}`,
          })),
        }),
      };
    });

    const result = await benchmark(
      "GitHub API Concurrent 50",
      async () => {
        const res = await searchRepos("react", { page: 1, perPage: 20 });
        expect(res.total_count).toBe(100);
      },
      { iterations: 50, concurrency: 50, warmupIterations: 3 }
    );

    logBenchmarkResult(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(5);
  }, 15000);
});
