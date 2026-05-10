import { NextRequest, NextResponse } from "next/server";
import { translateReadme } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";
import { getCache, setCache } from "@/lib/cache";
import { stableHash } from "@/lib/stable-hash";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/rate-limit";

const AI_TRANSLATE_CACHE_TTL_SECONDS = 86400;
const AI_BODY_MAX_BYTES = 160_000;
const AI_README_MAX_CHARS = 80_000;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_REQUESTS = 10;
const AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function getDailyQuota() {
  const value = Number(process.env.AI_DAILY_QUOTA_FREE ?? 200);
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), 1000) : 200;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`ai:translate:${session.user.id}`, {
      limit: AI_RATE_LIMIT_REQUESTS,
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many AI requests" }, { status: 429 });
    }
    const dailyLimit = checkRateLimit(`ai:daily:${session.user.id}`, {
      limit: getDailyQuota(),
      windowMs: AI_DAILY_WINDOW_MS,
    });
    if (!dailyLimit.allowed) {
      return NextResponse.json({ error: "AI daily quota exceeded" }, { status: 429 });
    }

    const body = await readJsonBody<Record<string, unknown>>(request, AI_BODY_MAX_BYTES);
    const { readme } = body;

    if (!readme || typeof readme !== "string") {
      return NextResponse.json({ error: "README content is required" }, { status: 400 });
    }
    if (readme.length > AI_README_MAX_CHARS) {
      return NextResponse.json({ error: "README content is too large" }, { status: 413 });
    }

    const { provider, customConfig } = await getUserAIConfig();
    const cacheKey = `ai:translate:${stableHash({
      userId: session.user.id,
      provider,
      model: customConfig?.model,
      apiEndpoint: customConfig?.apiEndpoint,
      readme,
    })}`;
    const cached = await getCache<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ translation: cached });
    }

    const translation = await translateReadme(readme, provider, customConfig);

    await setCache(cacheKey, translation, AI_TRANSLATE_CACHE_TTL_SECONDS);
    return NextResponse.json({ translation });
  } catch (error) {
    const { message, status } = jsonError(error, "Translation failed");
    return NextResponse.json({ error: message }, { status });
  }
}
