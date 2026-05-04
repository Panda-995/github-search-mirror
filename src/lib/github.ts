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
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitMirror/1.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`${GITHUB_API_BASE}${path}`, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function searchRepos(
  query: string,
  options: {
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    page?: number;
    perPage?: number;
  } = {}
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

  return githubFetch<GitHubSearchResponse>(`/search/repositories?${params}`);
}

export async function getRepo(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token);
}

export async function getRepoReadme(
  owner: string,
  repo: string,
  token?: string
): Promise<string> {
  const res = await githubFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/readme`,
    token
  );

  if (res.encoding === "base64") {
    return Buffer.from(res.content, "base64").toString("utf-8");
  }

  return res.content;
}

export async function getRepoLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number>> {
  return githubFetch<Record<string, number>>(
    `/repos/${owner}/${repo}/languages`,
    token
  );
}

export async function getTrendingRepos(
  period: "daily" | "weekly" | "monthly" = "daily",
  language?: string
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

  const result = await searchRepos(query, {
    sort: "stars",
    order: "desc",
    perPage: 30,
  });

  return result.items;
}

export type { GitHubRepo, GitHubSearchResponse };
