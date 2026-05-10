import { NextRequest, NextResponse } from "next/server";
import { getTrendingRepos } from "@/server/trending.actions";
import { parseTrendingRange, sanitizeQualifierValue } from "@/lib/search-params";
import { getCurrentGitHubToken } from "@/server/github-token";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = parseTrendingRange(searchParams.get("range"));
    const lang = sanitizeQualifierValue(searchParams.get("lang"));

    const repos = await getTrendingRepos(range, lang, await getCurrentGitHubToken());

    return NextResponse.json({
      repos,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取趋势失败";
    return NextResponse.json({ error: message, repos: [] }, { status: 500 });
  }
}
