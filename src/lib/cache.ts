import Redis from "ioredis";

let redis: Redis | null = null;
let redisInitialized = false;

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

const DEFAULT_REDIS_MAX_RETRIES = 1;
const DEFAULT_REDIS_CONNECT_TIMEOUT_MS = 2000;
const DEFAULT_MEMORY_CACHE_MAX_ENTRIES = 1000;

function getRedisConnectionOptions() {
  const port = Number(process.env.REDIS_PORT ?? 6379);

  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number.isFinite(port) ? port : 6379,
    password: process.env.REDIS_PASSWORD,
  };
}

function getRedis(): Redis | null {
  if (redisInitialized) return redis;
  redisInitialized = true;

  try {
    const connection = getRedisConnectionOptions();
    const options = {
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: DEFAULT_REDIS_MAX_RETRIES,
      connectTimeout: DEFAULT_REDIS_CONNECT_TIMEOUT_MS,
      lazyConnect: true,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    };
    const instance = new Redis({ ...connection, ...options });

    instance.on("error", () => undefined);

    redis = instance;
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

export async function getReadyRedis(): Promise<Redis | null> {
  if (process.env.NODE_ENV === "test" && process.env.USE_REDIS_IN_TEST !== "true") {
    return null;
  }

  const client = getRedis();
  if (!client) return null;

  try {
    const status = (client as Redis & { status?: string }).status;
    const connect = (client as Redis & { connect?: () => Promise<unknown> }).connect;

    if (status === "wait" && typeof connect === "function") {
      await connect.call(client);
    }

    return client;
  } catch {
    return null;
  }
}

function memoryGet<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value) as T;
  } catch {
    memoryCache.delete(key);
    return null;
  }
}

function memorySet(key: string, value: unknown, ttlSeconds: number): void {
  const now = Date.now();
  for (const [cacheKey, item] of memoryCache) {
    if (item.expiresAt <= now) memoryCache.delete(cacheKey);
  }

  const maxEntries = Number(
    process.env.MEMORY_CACHE_MAX_ENTRIES ?? DEFAULT_MEMORY_CACHE_MAX_ENTRIES
  );
  const boundedMaxEntries = Number.isFinite(maxEntries)
    ? Math.max(100, Math.trunc(maxEntries))
    : DEFAULT_MEMORY_CACHE_MAX_ENTRIES;
  while (memoryCache.size >= boundedMaxEntries) {
    const oldest = memoryCache.keys().next();
    if (oldest.done) break;
    memoryCache.delete(oldest.value);
  }

  memoryCache.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getReadyRedis();

  if (client) {
    try {
      const data = await client.get(key);
      if (data) {
        try {
          return JSON.parse(data) as T;
        } catch {
          await client.del(key).catch(() => {});
          return null;
        }
      }
    } catch {}
  }

  return memoryGet<T>(key);
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = await getReadyRedis();

  if (client) {
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {}
  }

  memorySet(key, value, ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  const client = await getReadyRedis();

  if (client) {
    try {
      await client.del(key);
    } catch {}
  }

  memoryCache.delete(key);
}

export { redis };
