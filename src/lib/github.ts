import { createHash } from "crypto";

const GITHUB_API_BASE = "https://api.github.com";

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  license: { name: string } | null;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  homepage: string | null;
  html_url: string;
  default_branch: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

// Simple in-memory cache for GitHub API responses
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getTokenHash(token?: string): string {
  return token ? createHash("sha256").update(token).digest("hex").slice(0, 16) : "public";
}

function getCacheKey(path: string, token?: string): string {
  return `${getTokenHash(token)}:${path}`;
}

export function clearGitHubCache(): void {
  cache.clear();
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const authToken =
    token ||
    (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes("your_")
      ? process.env.GITHUB_TOKEN
      : undefined);
  const cacheKey = getCacheKey(path, authToken);
  const cached = getCached<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitMirror/1.0",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${GITHUB_API_BASE}${path}`, { headers });

  if (!res.ok) {
    if (res.status === 403) {
      const errorText = typeof res.text === "function" ? await res.text().catch(() => "") : "";
      const remaining =
        typeof res.headers?.get === "function" ? res.headers.get("x-ratelimit-remaining") : null;
      if (errorText.includes("rate limit") || remaining === "0") {
        const hasToken = Boolean(authToken);
        throw new Error(
          "GitHub API rate limit exceeded. " +
            (hasToken
              ? "Your token has reached the hourly limit. Please try again later."
              : "No valid GITHUB_TOKEN configured. Please set a valid token in your .env.local file to increase the rate limit from 60 to 5000 requests per hour. Get one at https://github.com/settings/tokens")
        );
      }
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as T;
  setCached(cacheKey, data);
  return data;
}

export async function searchRepos(
  query: string,
  options: {
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    page?: number;
    perPage?: number;
  } = {},
  token?: string
): Promise<GitHubSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(options.page ?? 1),
    per_page: String(options.perPage ?? 20),
  });

  // Only add sort/order when explicitly requested
  // GitHub API default sort is "best match" (relevance) when sort is omitted
  if (options.sort) {
    params.set("sort", options.sort);
    params.set("order", options.order ?? "desc");
  }

  return githubFetch<GitHubSearchResponse>(`/search/repositories?${params}`, token);
}

export async function getRepo(owner: string, repo: string, token?: string): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token);
}

export async function getRepoReadme(owner: string, repo: string, token?: string): Promise<string> {
  const authToken =
    token ||
    (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes("your_")
      ? process.env.GITHUB_TOKEN
      : undefined);
  const cacheKey = `readme:${getTokenHash(authToken)}:${owner}/${repo}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const res = await githubFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/readme`,
    authToken
  );

  let content: string;
  if (res.encoding === "base64") {
    content = Buffer.from(res.content, "base64").toString("utf-8");
  } else {
    content = res.content;
  }

  setCached(cacheKey, content);
  return content;
}

export async function getRepoLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number>> {
  return githubFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`, token);
}

export async function getTrendingRepos(
  period: "daily" | "weekly" | "monthly" = "daily",
  language?: string,
  token?: string
): Promise<GitHubRepo[]> {
  const date = new Date();
  switch (period) {
    case "daily":
      date.setDate(date.getDate() - 1);
      break;
    case "weekly":
      date.setDate(date.getDate() - 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() - 1);
      break;
  }

  const dateStr = date.toISOString().split("T")[0];
  let query = `created:>${dateStr}`;
  if (language) {
    query += ` language:${language}`;
  }

  const result = await searchRepos(
    query,
    {
      sort: "stars",
      order: "desc",
      perPage: 30,
    },
    token
  );

  return result.items;
}

export type { GitHubRepo, GitHubSearchResponse };
