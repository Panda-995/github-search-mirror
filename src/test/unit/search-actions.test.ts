import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  meiliSearch: vi.fn(),
  githubSearch: vi.fn(),
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  getCache: mocks.getCache,
  setCache: mocks.setCache,
}));

vi.mock("@/lib/search", () => ({
  repoIndex: {
    search: mocks.meiliSearch,
  },
}));

vi.mock("@/lib/github", () => ({
  searchRepos: mocks.githubSearch,
}));

import { searchRepositories } from "@/server/search.actions";

function githubRepo(overrides: Record<string, unknown> = {}) {
  return {
    full_name: "facebook/react",
    name: "react",
    owner: { login: "facebook" },
    description: "The library for web and native user interfaces.",
    stargazers_count: 245000,
    forks_count: 51000,
    open_issues_count: 1000,
    watchers_count: 245000,
    language: "JavaScript",
    topics: ["react"],
    license: { name: "MIT" },
    created_at: "2013-05-24",
    pushed_at: "2026-05-01",
    updated_at: "2026-05-01",
    homepage: "https://react.dev",
    html_url: "https://github.com/facebook/react",
    ...overrides,
  };
}

describe("searchRepositories", () => {
  beforeEach(() => {
    mocks.meiliSearch.mockReset();
    mocks.githubSearch.mockReset();
    mocks.getCache.mockReset();
    mocks.setCache.mockReset();
    mocks.getCache.mockResolvedValue(null);
    mocks.setCache.mockResolvedValue(undefined);
  });

  it("falls back to GitHub when Meilisearch is reachable but empty", async () => {
    mocks.meiliSearch.mockResolvedValueOnce({
      hits: [],
      estimatedTotalHits: 0,
    });
    mocks.githubSearch.mockResolvedValueOnce({
      total_count: 1,
      items: [githubRepo()],
    });

    const result = await searchRepositories(
      "react",
      { language: ["JavaScript"], stars_min: 1000 },
      { perPage: 2 }
    );

    expect(mocks.githubSearch).toHaveBeenCalledWith(
      "react language:JavaScript stars:>=1000",
      expect.objectContaining({ perPage: 2 }),
      undefined
    );
    expect(result.total).toBe(1);
    expect(result.results[0].full_name).toBe("facebook/react");
  });

  it("uses Meilisearch results when the local index has hits", async () => {
    mocks.meiliSearch.mockResolvedValueOnce({
      estimatedTotalHits: 1,
      hits: [
        {
          full_name: "local/repo",
          name: "repo",
          owner: "local",
          description: "Indexed result",
          stars: 12,
          forks: 3,
          open_issues: 1,
          watchers: 12,
          language: "TypeScript",
          topics: ["indexed"],
          license: "MIT",
          created_at: "2025-01-01",
          pushed_at: "2026-01-01",
          updated_at: "2026-01-01",
          homepage: null,
          html_url: "https://github.com/local/repo",
        },
      ],
    });

    const result = await searchRepositories("repo", {}, { perPage: 1 });

    expect(mocks.githubSearch).not.toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.results[0].full_name).toBe("local/repo");
  });
});
