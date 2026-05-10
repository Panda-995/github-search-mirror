import { NextRequest, NextResponse } from "next/server";
import { searchRepositories } from "@/server/search.actions";
import { parseSearchQuery } from "@/lib/search-parser";
import { getCurrentGitHubToken } from "@/server/github-token";
import {
  normalizeSearchQuery,
  parseSearchOrder,
  parseSearchPage,
  parseSearchPerPage,
  parseSearchSort,
  sanitizeQualifierValue,
} from "@/lib/search-params";
import type { SearchFilters } from "@/types";

function parseNumericFilter(
  value: string | null,
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = normalizeSearchQuery(searchParams.get("q"));
    const page = parseSearchPage(searchParams.get("page"));
    const perPage = parseSearchPerPage(searchParams.get("per_page"));

    const parsed = parseSearchQuery(q);
    const filters: SearchFilters = { ...parsed.filters };

    const language = sanitizeQualifierValue(searchParams.get("language"));
    if (language) filters.language = [language];

    parseNumericFilter(searchParams.get("stars"), "stars_min", "stars_max", filters);
    parseNumericFilter(searchParams.get("forks"), "forks_min", "forks_max", filters);

    const updated = searchParams.get("updated");
    if (updated) {
      const match = updated.match(/^>(\d+)d$/);
      if (match) filters.pushed_after = daysAgo(Number(match[1]));
    }

    const sort = parseSearchSort(searchParams.get("sort")) ?? parsed.sort;
    const order = parseSearchOrder(searchParams.get("order")) ?? parsed.order;
    const token = await getCurrentGitHubToken();

    const result = await searchRepositories(
      parsed.query,
      filters,
      {
        sort,
        order,
        page,
        perPage,
      },
      token
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "搜索失败";
    return NextResponse.json(
      {
        error: message,
        total: 0,
        page: 1,
        per_page: 20,
        results: [],
        facets: { language: [], license: [], topic: [] },
      },
      { status: 500 }
    );
  }
}
