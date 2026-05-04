import { NextRequest, NextResponse } from "next/server";
import { getTrendingRepos } from "@/server/trending.actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get("range") ?? "daily") as
    | "daily"
    | "weekly"
    | "monthly";
  const lang = searchParams.get("lang") ?? undefined;

  const repos = await getTrendingRepos(range, lang);

  return NextResponse.json({
    repos,
    updated_at: new Date().toISOString(),
  });
}
