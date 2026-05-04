"use server";

import { getCache, setCache } from "@/lib/cache";
import { getRepo, getRepoReadme, getRepoLanguages } from "@/lib/github";
import type { RepoItem } from "@/types";

interface RepoDetail extends RepoItem {
  readme: string;
  languages: Record<string, number>;
}

export async function getRepoDetail(
  owner: string,
  repo: string
): Promise<RepoDetail> {
  const cacheKey = `repo:${owner}/${repo}`;
  const cached = await getCache<RepoDetail>(cacheKey);
  if (cached) return cached;

  const [repoData, readme, languages] = await Promise.all([
    getRepo(owner, repo),
    getRepoReadme(owner, repo).catch(() => ""),
    getRepoLanguages(owner, repo).catch(() => ({} as Record<string, number>)),
  ]);

  const detail: RepoDetail = {
    full_name: repoData.full_name,
    name: repoData.name,
    owner: repoData.owner.login,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    open_issues: repoData.open_issues_count,
    watchers: repoData.watchers_count,
    language: repoData.language,
    topics: repoData.topics,
    license: repoData.license?.name ?? null,
    created_at: repoData.created_at,
    pushed_at: repoData.pushed_at,
    updated_at: repoData.updated_at,
    homepage: repoData.homepage,
    html_url: repoData.html_url,
    readme,
    languages,
  };

  const ttl = repoData.stargazers_count > 1000 ? 1800 : 7200;
  await setCache(cacheKey, detail, ttl);

  return detail;
}
