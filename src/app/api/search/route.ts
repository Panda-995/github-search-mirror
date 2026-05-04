import { NextRequest, NextResponse } from "next/server";
import { searchRepositories } from "@/server/search.actions";
import { parseSearchQuery } from "@/lib/search-parser";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("per_page") ?? "20");

  const parsed = parseSearchQuery(q);

  const result = await searchRepositories(parsed.query, parsed.filters, {
    sort: parsed.sort,
    order: parsed.order,
    page,
    perPage,
  });

  return NextResponse.json(result);
}
