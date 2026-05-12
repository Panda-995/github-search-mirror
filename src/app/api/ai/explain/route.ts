import { NextRequest, NextResponse } from "next/server";
import { explainProject } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";
import { getCache, setCache } from "@/lib/cache";
import { stableHash } from "@/lib/stable-hash";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/api-guard";
import { checkAIDailyLimit } from "@/lib/ai-rate-limit";
import { checkRateLimitAsync } from "@/lib/rate-limit";

const AI_EXPLAIN_CACHE_TTL_SECONDS = 86400;
const AI_BODY_MAX_BYTES = 120_000;
const AI_README_MAX_CHARS = 60_000;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_REQUESTS = 20;
const AI_EXPLAIN_CACHE_VERSION = "natural-summary-v1";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`ai:explain:${session.user.id}`, {
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
    const { repoName, description, readme } = body;

    if (!repoName || typeof repoName !== "string") {
      return NextResponse.json({ error: "repoName is required" }, { status: 400 });
    }
    if (typeof readme === "string" && readme.length > AI_README_MAX_CHARS) {
      return NextResponse.json({ error: "README content is too large" }, { status: 413 });
    }

    const { provider, customConfig } = await getUserAIConfig();
    const cacheKey = `ai:explain:${stableHash({
      version: AI_EXPLAIN_CACHE_VERSION,
      userId: session.user.id,
      provider,
      model: customConfig?.model,
      apiEndpoint: customConfig?.apiEndpoint,
      repoName,
      description: description ?? "",
      readme: readme ?? "",
    })}`;
    const cached = await getCache<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await explainProject(
      repoName as string,
      (description as string) ?? "",
      (readme as string) ?? "",
      provider,
      customConfig
    );

    await setCache(cacheKey, result, AI_EXPLAIN_CACHE_TTL_SECONDS);
    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = jsonError(error, "Explanation failed");
    return NextResponse.json({ error: message }, { status });
  }
}
