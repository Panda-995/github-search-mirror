import { NextRequest, NextResponse } from "next/server";
import { explainCode } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";
import { getCache, setCache } from "@/lib/cache";
import { stableHash } from "@/lib/stable-hash";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/api-guard";
import { checkAIDailyLimit } from "@/lib/ai-rate-limit";
import { checkRateLimitAsync } from "@/lib/rate-limit";

const AI_EXPLAIN_CODE_CACHE_TTL_SECONDS = 86400;
const AI_BODY_MAX_BYTES = 120_000;
const AI_CODE_MAX_CHARS = 60_000;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_REQUESTS = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`ai:explain-code:${session.user.id}`, {
      limit: AI_RATE_LIMIT_REQUESTS,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many AI requests" }, { status: 429 });
    }
    const dailyLimit = await checkAIDailyLimit(session.user.id);
    if (!dailyLimit.allowed) {
      return NextResponse.json({ error: "AI daily quota exceeded" }, { status: 429 });
    }

    const body = await readJsonBody<Record<string, unknown>>(request, AI_BODY_MAX_BYTES);
    const { code, language } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    if (code.length > AI_CODE_MAX_CHARS) {
      return NextResponse.json({ error: "Code is too large" }, { status: 413 });
    }

    const { provider, customConfig } = await getUserAIConfig();
    const cacheKey = `ai:explain-code:${stableHash({
      userId: session.user.id,
      provider,
      model: customConfig?.model,
      apiEndpoint: customConfig?.apiEndpoint,
      language: language ?? "auto",
      code,
    })}`;
    const cached = await getCache<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ explanation: cached });
    }

    const explanation = await explainCode(
      code,
      typeof language === "string" ? language.slice(0, 64) : "auto",
      provider,
      customConfig
    );

    await setCache(cacheKey, explanation, AI_EXPLAIN_CODE_CACHE_TTL_SECONDS);
    return NextResponse.json({ explanation });
  } catch (error) {
    const { message, status } = jsonError(error, "Code explanation failed");
    return NextResponse.json({ error: message }, { status });
  }
}
