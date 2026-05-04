import { NextRequest, NextResponse } from "next/server";
import { explainCode } from "@/lib/ai";
import { getCache, setCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, language } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const cacheKey = `ai:explain-code:${Buffer.from(code.slice(0, 200)).toString("base64")}`;
  const cached = await getCache<string>(cacheKey);
  if (cached) {
    return NextResponse.json({ explanation: cached });
  }

  try {
    const explanation = await explainCode(code, language ?? "auto");
    await setCache(cacheKey, explanation, 86400);
    return NextResponse.json({ explanation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Code explanation failed" },
      { status: 500 }
    );
  }
}
