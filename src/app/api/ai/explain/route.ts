import { NextRequest, NextResponse } from "next/server";
import { explainProject } from "@/lib/ai";
import { getCache, setCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { repoName, description, readme } = body;

  if (!repoName) {
    return NextResponse.json({ error: "repoName is required" }, { status: 400 });
  }

  const cacheKey = `ai:explain:${repoName}`;
  const cached = await getCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await explainProject(repoName, description ?? "", readme ?? "");
    await setCache(cacheKey, result, 86400);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Explanation failed" },
      { status: 500 }
    );
  }
}
