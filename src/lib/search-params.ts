export const DEFAULT_SEARCH_PAGE = 1;
export const DEFAULT_SEARCH_PER_PAGE = 20;
export const MAX_SEARCH_PAGE = 100;
export const MAX_SEARCH_PER_PAGE = 50;
export const MAX_SEARCH_QUERY_LENGTH = 256;

export function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function parseSearchPage(value: string | null | undefined) {
  return clampInteger(value, DEFAULT_SEARCH_PAGE, 1, MAX_SEARCH_PAGE);
}

export function parseSearchPerPage(value: string | null | undefined) {
  return clampInteger(value, DEFAULT_SEARCH_PER_PAGE, 1, MAX_SEARCH_PER_PAGE);
}

export function parseSearchSort(value: string | null | undefined) {
  return value === "stars" || value === "forks" || value === "updated" ? value : undefined;
}

export function parseSearchOrder(value: string | null | undefined) {
  return value === "desc" || value === "asc" ? value : undefined;
}

export function normalizeSearchQuery(value: string | null | undefined) {
  return (value ?? "").trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
}

export function sanitizeQualifierValue(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return /^[\w+#.-]{1,80}$/.test(trimmed) ? trimmed : undefined;
}

export function parseTrendingRange(value: string | null | undefined) {
  return value === "weekly" || value === "monthly" ? value : "daily";
}
