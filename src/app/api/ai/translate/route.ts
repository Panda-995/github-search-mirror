import { NextRequest, NextResponse } from "next/server";
import { translateReadme } from "@/lib/ai";
import { getCache, setCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { readme } = body;

  if (!readme || typeof readme !== "string") {
    return NextResponse.json({ error: "README content is required" }, { status: 400 });
  }

  const cacheKey = `ai:translate:${Buffer.from(readme.slice(0, 200)).toString("base64")}`;
  const cached = await getCache<string>(cacheKey);
  if (cached) {
    return NextResponse.json({ translation: cached });
  }

  try {
    const translation = await translateReadme(readme);
    await setCache(cacheKey, translation, 86400);
    return NextResponse.json({ translation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Translation failed" },
      { status: 500 }
    );
  }
}
