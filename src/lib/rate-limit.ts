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
