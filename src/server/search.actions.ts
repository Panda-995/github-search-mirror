"use server";

import { getCache, setCache } from "@/lib/cache";
import { repoIndex } from "@/lib/search";
import { searchRepos } from "@/lib/github";
import type { RepoItem, SearchFilters, SearchResult } from "@/types";

function githubRepoToItem(repo: {
  full_name: string;
  name: string;
  owner: { login: string };
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
}): RepoItem {
  return {
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
  };
}

function buildMeiliFilter(filters: SearchFilters): string[] {
  const conditions: string[] = [];

  if (filters.language?.length) {
    conditions.push(
      `language IN [${filters.language.map((l) => `"${l}"`).join(", ")}]`
    );
  }
  if (filters.stars_min !== undefined) {
    conditions.push(`stars >= ${filters.stars_min}`);
  }
  if (filters.stars_max !== undefined) {
    conditions.push(`stars <= ${filters.stars_max}`);
  }
  if (filters.forks_min !== undefined) {
    conditions.push(`forks >= ${filters.forks_min}`);
  }
  if (filters.forks_max !== undefined) {
    conditions.push(`forks <= ${filters.forks_max}`);
  }
  if (filters.updated_after) {
    conditions.push(`pushed_at >= ${filters.updated_after}`);
  }
  if (filters.created_after) {
    conditions.push(`created_at >= ${filters.created_after}`);
  }
  if (filters.license?.length) {
    conditions.push(
      `license IN [${filters.license.map((l) => `"${l}"`).join(", ")}]`
    );
  }
  if (filters.topic?.length) {
    conditions.push(
      `topics IN [${filters.topic.map((t) => `"${t}"`).join(", ")}]`
    );
  }

  return conditions;
}

export async function searchRepositories(
  query: string,
  filters: SearchFilters = {},
  options: {
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    page?: number;
    perPage?: number;
  } = {}
): Promise<SearchResult> {
  const cacheKey = `search:${query}:${JSON.stringify(filters)}:sort=${options.sort ?? "relevance"}:page=${options.page ?? 1}`;
  const cached = await getCache<SearchResult>(cacheKey);
  if (cached) return cached;

  try {
    const meiliFilters = buildMeiliFilter(filters);
    // Map sort field to Meilisearch sortable attribute
    const meiliSortField = options.sort === "updated" ? "updated_at" : options.sort;
    const meiliResult = await repoIndex.search(query, {
      filter: meiliFilters,
      sort: meiliSortField ? [`${meiliSortField}:${options.order ?? "desc"}`] : undefined,
      limit: options.perPage ?? 20,
      offset: ((options.page ?? 1) - 1) * (options.perPage ?? 20),
    });

    const results: RepoItem[] = meiliResult.hits.map((hit: Record<string, unknown>) => ({
      full_name: String(hit.full_name),
      name: String(hit.name),
      owner: String(hit.owner),
      description: hit.description ? String(hit.description) : null,
      stars: Number(hit.stars),
      forks: Number(hit.forks),
      open_issues: Number(hit.open_issues),
      watchers: Number(hit.watchers),
      language: hit.language ? String(hit.language) : null,
      topics: Array.isArray(hit.topics) ? hit.topics.map(String) : [],
      license: hit.license ? String(hit.license) : null,
      created_at: String(hit.created_at),
      pushed_at: String(hit.pushed_at),
      updated_at: String(hit.updated_at),
      homepage: hit.homepage ? String(hit.homepage) : null,
      html_url: String(hit.html_url),
    }));

    const result: SearchResult = {
      total: meiliResult.estimatedTotalHits ?? 0,
      page: options.page ?? 1,
      per_page: options.perPage ?? 20,
      results,
      facets: { language: [], license: [], topic: [] },
    };

    await setCache(cacheKey, result, 300);
    return result;
  } catch {
    const githubResult = await searchRepos(query, {
      sort: options.sort,
      order: options.order,
      page: options.page,
      perPage: options.perPage,
    });

    const result: SearchResult = {
      total: githubResult.total_count,
      page: options.page ?? 1,
      per_page: options.perPage ?? 20,
      results: githubResult.items.map(githubRepoToItem),
      facets: { language: [], license: [], topic: [] },
    };

    await setCache(cacheKey, result, 300);
    return result;
  }
}
