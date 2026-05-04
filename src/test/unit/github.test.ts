import { describe, it, expect } from "vitest";
import { searchRepos, getRepo, getRepoReadme, getTrendingRepos } from "@/lib/github";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GitHub API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should search repositories with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        total_count: 100,
        items: [
          {
            id: 1,
            full_name: "facebook/react",
            name: "react",
            owner: { login: "facebook", avatar_url: "" },
            description: "A JavaScript library",
            stargazers_count: 200000,
            forks_count: 40000,
            open_issues_count: 1000,
            watchers_count: 200000,
            language: "JavaScript",
            topics: ["frontend", "ui"],
            license: { name: "MIT" },
            created_at: "2013-05-24",
            pushed_at: "2024-01-01",
            updated_at: "2024-01-01",
            homepage: "https://react.dev",
            html_url: "https://github.com/facebook/react",
          },
        ],
      }),
    });

    const result = await searchRepos("react", { sort: "stars", order: "desc", page: 1, perPage: 20 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/search/repositories?q=react"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github.v3+json",
        }),
      })
    );
    expect(result.total_count).toBe(100);
    expect(result.items[0].full_name).toBe("facebook/react");
  });

  it("should get repository details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        full_name: "facebook/react",
        name: "react",
        owner: { login: "facebook", avatar_url: "" },
        description: "A JavaScript library",
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 1000,
        watchers_count: 200000,
        language: "JavaScript",
        topics: ["frontend"],
        license: { name: "MIT" },
        created_at: "2013-05-24",
        pushed_at: "2024-01-01",
        updated_at: "2024-01-01",
        homepage: "https://react.dev",
        html_url: "https://github.com/facebook/react",
      }),
    });

    const result = await getRepo("facebook", "react");
    expect(result.full_name).toBe("facebook/react");
    expect(result.stargazers_count).toBe(200000);
  });

  it("should get README content", async () => {
    const readmeContent = "# React\nA JavaScript library";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: Buffer.from(readmeContent).toString("base64"),
        encoding: "base64",
      }),
    });

    const result = await getRepoReadme("facebook", "react");
    expect(result).toBe(readmeContent);
  });

  it("should get trending repositories", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        total_count: 30,
        items: Array.from({ length: 30 }, (_, i) => ({
          id: i,
          full_name: `user/repo${i}`,
          name: `repo${i}`,
          owner: { login: "user", avatar_url: "" },
          description: "Test repo",
          stargazers_count: 100 + i,
          forks_count: 10,
          open_issues_count: 5,
          watchers_count: 100,
          language: "TypeScript",
          topics: [],
          license: null,
          created_at: "2024-01-01",
          pushed_at: "2024-01-01",
          updated_at: "2024-01-01",
          homepage: null,
          html_url: `https://github.com/user/repo${i}`,
        })),
      }),
    });

    const result = await getTrendingRepos("daily", "typescript");
    expect(result).toHaveLength(30);
    expect(result[0].full_name).toBe("user/repo0");
  });

  it("should throw on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(getRepo("test", "repo")).rejects.toThrow("GitHub API error: 403 Forbidden");
  });
});
