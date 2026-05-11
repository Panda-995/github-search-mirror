import { getReadyRedis } from "@/lib/cache";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();
const MAX_BUCKETS = 5000;

function pruneBuckets(now: number) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size <= MAX_BUCKETS) return;

  const overflow = buckets.size - MAX_BUCKETS;
  const keys = buckets.keys();
  for (let idx = 0; idx < overflow; idx++) {
    const next = keys.next();
    if (next.done) break;
    buckets.delete(next.value);
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  pruneBuckets(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: options.limit - current.count,
    resetAt: current.resetAt,
  };
}

function parseRedisRateLimitResult(result: unknown) {
  if (!Array.isArray(result) || result.length < 2) return null;

  const count = Number(result[0]);
  const ttl = Number(result[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttl)) return null;

  return { count, ttl };
}

export async function checkRateLimitAsync(key: string, options: RateLimitOptions) {
  const client = await getReadyRedis();
  if (!client) return checkRateLimit(key, options);

  const redisKey = `rate-limit:${key}`;
  const now = Date.now();

  try {
    const result = await client.eval(
      `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("PEXPIRE", KEYS[1], ARGV[1])
      end
      local ttl = redis.call("PTTL", KEYS[1])
      return { current, ttl }
      `,
      1,
      redisKey,
      String(options.windowMs)
    );
    const parsed = parseRedisRateLimitResult(result);
    if (!parsed) return checkRateLimit(key, options);

    const resetAt = now + (parsed.ttl > 0 ? parsed.ttl : options.windowMs);
    return {
      allowed: parsed.count <= options.limit,
      remaining: Math.max(options.limit - parsed.count, 0),
      resetAt,
    };
  } catch {
    return checkRateLimit(key, options);
  }
}

export function resetRateLimitForTests() {
  if (process.env.NODE_ENV === "test") buckets.clear();
}
