import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/db";
import { getReadyRedis } from "@/lib/cache";
import { meiliClient } from "@/lib/search";

type HealthCheck = {
  name: string;
  ok: boolean;
  mode: string;
  required: boolean;
  error?: string;
};

async function checkRedisHealth() {
  const redis = await getReadyRedis();
  if (!redis) return { ok: false, mode: "unavailable" };

  await redis.ping();
  return { ok: true, mode: "redis" };
}

async function checkSearchHealth() {
  await meiliClient.health();
  return { ok: true, mode: "meilisearch" };
}

async function settle(
  name: string,
  required: boolean,
  check: () => Promise<{ ok: boolean; mode: string }>
): Promise<HealthCheck> {
  try {
    return { name, required, ...(await check()) };
  } catch (error) {
    return {
      name,
      ok: false,
      mode: "error",
      required,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

export async function GET(request: Request) {
  const strict = new URL(request.url).searchParams.get("strict") === "true";
  const checks = await Promise.all([
    settle("database", true, checkDatabaseHealth),
    settle("redis", false, checkRedisHealth),
    settle("search", false, checkSearchHealth),
  ]);
  const requiredOk = checks.filter((check) => check.required).every((check) => check.ok);
  const allOk = checks.every((check) => check.ok);
  const ok = strict ? allOk : requiredOk;
  const status = requiredOk ? (allOk ? "ok" : "degraded") : "down";

  return NextResponse.json(
    {
      ok,
      status,
      service: "gitmirror",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
