"use server";

import { getCache, setCache } from "@/lib/cache";
import { repoIndex } from "@/lib/search";
import { searchRepos } from "@/lib/github";
import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_PER_PAGE,
  MAX_SEARCH_PAGE,
  MAX_SEARCH_PER_PAGE,
  clampInteger,
  sanitizeQualifierValue,
} from "@/lib/search-params";
import type { RepoItem, SearchFilters, SearchResult } from "@/types";
import { createHash } from "crypto";

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
  const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

  if (filters.language?.length) {
    conditions.push(`language IN [${filters.language.map(quote).join(", ")}]`);
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
  if (filters.pushed_after) {
    conditions.push(`pushed_at >= ${quote(filters.pushed_after)}`);
  }
  if (filters.created_after) {
    conditions.push(`created_at >= ${quote(filters.created_after)}`);
  }
  if (filters.license?.length) {
    conditions.push(`license IN [${filters.license.map(quote).join(", ")}]`);
  }
  if (filters.topic?.length) {
    conditions.push(`topics IN [${filters.topic.map(quote).join(", ")}]`);
  }
  if (filters.user) {
    conditions.push(`owner = ${quote(filters.user)}`);
  }
  if (filters.org) {
    conditions.push(`owner = ${quote(filters.org)}`);
  }

  return conditions;
}

function sanitizeFilters(filters: SearchFilters): SearchFilters {
  const nonNegative = (value: number | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : undefined;

  return {
    in: filters.in?.filter(
      (value) => value === "name" || value === "description" || value === "readme"
    ),
    language: filters.language?.map(sanitizeQualifierValue).filter(Boolean) as string[] | undefined,
    stars_min: nonNegative(filters.stars_min),
    stars_max: nonNegative(filters.stars_max),
    forks_min: nonNegative(filters.forks_min),
    forks_max: nonNegative(filters.forks_max),
    pushed_after: filters.pushed_after,
    created_after: filters.created_after,
    license: filters.license?.map(sanitizeQualifierValue).filter(Boolean) as string[] | undefined,
    topic: filters.topic?.map(sanitizeQualifierValue).filter(Boolean) as string[] | undefined,
    user: sanitizeQualifierValue(filters.user),
    org: sanitizeQualifierValue(filters.org),
  };
}

function buildGitHubQuery(query: string, filters: SearchFilters): string {
  const parts = [query.trim()].filter(Boolean);

  filters.in?.forEach((value) => parts.push(`in:${value}`));
  filters.language?.forEach((value) => parts.push(`language:${value}`));
  if (filters.stars_min !== undefined) parts.push(`stars:>=${filters.stars_min}`);
  if (filters.stars_max !== undefined) parts.push(`stars:<=${filters.stars_max}`);
  if (filters.forks_min !== undefined) parts.push(`forks:>=${filters.forks_min}`);
  if (filters.forks_max !== undefined) parts.push(`forks:<=${filters.forks_max}`);
  if (filters.pushed_after) parts.push(`pushed:>=${filters.pushed_after}`);
  if (filters.created_after) parts.push(`created:>=${filters.created_after}`);
  filters.license?.forEach((value) => parts.push(`license:${value}`));
  filters.topic?.forEach((value) => parts.push(`topic:${value}`));
  if (filters.user) parts.push(`user:${filters.user}`);
  if (filters.org) parts.push(`org:${filters.org}`);

  return parts.join(" ");
}

async function searchGitHub(
  query: string,
  filters: SearchFilters,
  options: {
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    page?: number;
    perPage?: number;
  },
  token?: string
): Promise<SearchResult> {
  const githubQuery = buildGitHubQuery(query, filters);
  if (!githubQuery) {
    return {
      total: 0,
      page: options.page ?? 1,
      per_page: options.perPage ?? 20,
      results: [],
      facets: { language: [], license: [], topic: [] },
    };
  }

  const githubResult = await searchRepos(
    githubQuery,
    {
      sort: options.sort,
      order: options.order,
      page: options.page,
      perPage: options.perPage,
    },
    token
  );

  return {
    total: githubResult.total_count,
    page: options.page ?? 1,
    per_page: options.perPage ?? 20,
    results: githubResult.items.map(githubRepoToItem),
    facets: { language: [], license: [], topic: [] },
  };
}

const SEARCH_CACHE_TTL_SECONDS = 300;

function tokenCacheScope(token?: string) {
  return token ? createHash("sha256").update(token).digest("hex").slice(0, 16) : "public";
}

export async function searchRepositories(
  query: string,
  filters: SearchFilters = {},
  options: {
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    page?: number;
    perPage?: number;
  } = {},
  token?: string
): Promise<SearchResult> {
  const page = clampInteger(options.page, DEFAULT_SEARCH_PAGE, 1, MAX_SEARCH_PAGE);
  const perPage = clampInteger(options.perPage, DEFAULT_SEARCH_PER_PAGE, 1, MAX_SEARCH_PER_PAGE);
  const safeQuery = query.trim().slice(0, 256);
  const safeFilters = sanitizeFilters(filters);
  const cacheKey = `search:v3:${tokenCacheScope(token)}:${safeQuery}:${JSON.stringify(safeFilters)}:sort=${options.sort ?? "relevance"}:order=${options.order ?? "desc"}:page=${page}:perPage=${perPage}`;
  const cached = await getCache<SearchResult>(cacheKey);
  if (cached) return cached;

  try {
    const meiliFilters = buildMeiliFilter(safeFilters);
    // Map sort field to Meilisearch sortable attribute
    const meiliSortField = options.sort === "updated" ? "updated_at" : options.sort;
    const meiliResult = await repoIndex.search(safeQuery, {
      filter: meiliFilters,
      sort: meiliSortField ? [`${meiliSortField}:${options.order ?? "desc"}`] : undefined,
      attributesToSearchOn: safeFilters.in?.length ? safeFilters.in : undefined,
      limit: perPage,
      offset: (page - 1) * perPage,
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

    if (results.length === 0 && buildGitHubQuery(safeQuery, safeFilters)) {
      const fallbackResult = await searchGitHub(
        safeQuery,
        safeFilters,
        { ...options, page, perPage },
        token
      );
      await setCache(cacheKey, fallbackResult, SEARCH_CACHE_TTL_SECONDS);
      return fallbackResult;
    }

    const result: SearchResult = {
      total: meiliResult.estimatedTotalHits ?? 0,
      page,
      per_page: perPage,
      results,
      facets: { language: [], license: [], topic: [] },
    };

    await setCache(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  } catch {
    const result = await searchGitHub(safeQuery, safeFilters, { ...options, page, perPage }, token);
    await setCache(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
    return result;
  }
}
