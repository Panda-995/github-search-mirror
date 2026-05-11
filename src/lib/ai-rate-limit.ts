import { checkRateLimitAsync } from "@/lib/rate-limit";

const AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function getDailyQuota() {
  const value = Number(process.env.AI_DAILY_QUOTA_FREE ?? 200);
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), 1000) : 200;
}

export function checkAIDailyLimit(userId: string) {
  return checkRateLimitAsync(`ai:daily:${userId}`, {
    limit: getDailyQuota(),
    windowMs: AI_DAILY_WINDOW_MS,
  });
}
