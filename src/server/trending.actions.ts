"use server";

import { getCache, setCache } from "@/lib/cache";
import { getTrendingRepos as fetchTrendingRepos } from "@/lib/github";
import type { TrendingRepo } from "@/types";
import { createHash } from "crypto";

function calculateTrendScore(repo: {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}): number {
  return repo.stargazers_count * 3 + repo.forks_count * 2 + repo.open_issues_count * 0.5;
}

export async function getTrendingRepos(
  period: "daily" | "weekly" | "monthly" = "daily",
  language?: string,
  token?: string
): Promise<TrendingRepo[]> {
  const tokenScope = token
    ? createHash("sha256").update(token).digest("hex").slice(0, 16)
    : "public";
  const cacheKey = `trending:${tokenScope}:${period}:${language ?? "all"}`;
  const cached = await getCache<TrendingRepo[]>(cacheKey);
  if (cached) return cached;

  const repos = await fetchTrendingRepos(period, language, token);

  const trending: TrendingRepo[] = repos.map((repo, index) => ({
    full_name: repo.full_name,
    name: repo.name,
    owner: repo.owner.login,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    open_issues: repo.open_issues_count,
    watchers: repo.watchers_count,
    language: repo.language,
    topics: repo.topics,
    license: repo.license?.name ?? null,
    created_at: repo.created_at,
    pushed_at: repo.pushed_at,
    updated_at: repo.updated_at,
    homepage: repo.homepage,
    html_url: repo.html_url,
    rank: index + 1,
    stars_today: repo.stargazers_count,
    trend_score: calculateTrendScore(repo),
  }));

  const TRENDING_CACHE_TTL_SECONDS = 3600;

  await setCache(cacheKey, trending, TRENDING_CACHE_TTL_SECONDS);
  return trending;
}
