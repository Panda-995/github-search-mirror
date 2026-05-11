import { parseSearchQuery } from "@/lib/search-parser";
import {
  normalizeSearchQuery,
  parseSearchOrder,
  parseSearchPage,
  parseSearchPerPage,
  parseSearchSort,
  sanitizeQualifierValue,
} from "@/lib/search-params";
import type { SearchFilters } from "@/types";

export interface SearchRequestInput {
  q?: string | null;
  language?: string | null;
  stars?: string | null;
  forks?: string | null;
  updated?: string | null;
  sort?: string | null;
  order?: string | null;
  page?: string | null;
  per_page?: string | null;
}

export interface SearchRequestOptions {
  includePerPage?: boolean;
  defaultPerPage?: number;
}

function parseNumericFilter(
  value: string | null | undefined,
  minKey: "stars_min" | "forks_min",
  maxKey: "stars_max" | "forks_max",
  filters: SearchFilters
) {
  if (!value) return;
  const match = value.match(/^([<>]=?|=)?(\d+)$/);
  if (!match) return;

  const operator = match[1] || ">=";
  const amount = Number(match[2]);
  if (operator === "<" || operator === "<=") {
    filters[maxKey] = amount;
  } else {
    filters[minKey] = amount;
  }
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export function buildSearchRequest(input: SearchRequestInput, options: SearchRequestOptions = {}) {
  const normalizedQuery = normalizeSearchQuery(input.q);
  const page = parseSearchPage(input.page);
  const perPage = options.includePerPage
    ? parseSearchPerPage(input.per_page)
    : (options.defaultPerPage ?? 20);

  const parsed = parseSearchQuery(normalizedQuery);
  const filters: SearchFilters = { ...parsed.filters };

  const language = sanitizeQualifierValue(input.language);
  if (language) filters.language = [language];

  parseNumericFilter(input.stars, "stars_min", "stars_max", filters);
  parseNumericFilter(input.forks, "forks_min", "forks_max", filters);

  if (input.updated) {
    const match = input.updated.match(/^>(\d+)d$/);
    if (match) filters.pushed_after = daysAgo(Number(match[1]));
  }

  return {
    normalizedQuery,
    searchQuery: parsed.query,
    filters,
    sort: parseSearchSort(input.sort) ?? parsed.sort ?? undefined,
    order: parseSearchOrder(input.order) ?? parsed.order ?? undefined,
    page,
    perPage,
  };
}
