import Redis from "ioredis";

let redis: Redis | null = null;
let redisAvailable = false;
let redisInitialized = false;

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function getRedis(): Redis | null {
  if (redisInitialized) return redis;
  redisInitialized = true;

  try {
    const instance = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });

    instance.on("connect", () => {
      redisAvailable = true;
    });

    instance.on("error", () => {
      redisAvailable = false;
    });

    redis = instance;
    return redis;
  } catch {
    redis = null;
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
  return JSON.parse(item.value) as T;
}

function memorySet(key: string, value: unknown, ttlSeconds: number): void {
  memoryCache.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      const data = await client.get(key);
      if (data) return JSON.parse(data) as T;
    } catch {
      redisAvailable = false;
    }
  }

  return memoryGet<T>(key);
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {
      redisAvailable = false;
    }
  }

  memorySet(key, value, ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      await client.del(key);
    } catch {
      redisAvailable = false;
    }
  }

  memoryCache.delete(key);
}

export { redis };
