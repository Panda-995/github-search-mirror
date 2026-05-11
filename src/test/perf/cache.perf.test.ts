import { describe, it, expect, vi, beforeEach } from "vitest";
import { benchmark, assertPerformance, logBenchmarkResult } from "./benchmark";

const mockRedis = {
  data: new Map<string, string>(),

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  },

  async setex(key: string, _ttl: number, value: string): Promise<void> {
    this.data.set(key, value);
  },

  async del(key: string): Promise<void> {
    this.data.delete(key);
  },

  reset() {
    this.data.clear();
  },
};

vi.mock("ioredis", () => ({
  default: class Redis {
    get = mockRedis.get.bind(mockRedis);
    setex = mockRedis.setex.bind(mockRedis);
    del = mockRedis.del.bind(mockRedis);
  },
}));

const { getCache, setCache, deleteCache } = await import("@/lib/cache");

describe("Cache Performance", () => {
  beforeEach(() => {
    mockRedis.reset();
  });

  it("cache set should complete within 50ms", async () => {
    const testData = { foo: "bar", count: 42, nested: { a: 1, b: 2 } };

    const result = await benchmark(
      "Cache Set",
      async () => {
        await setCache(`perf-key-${Math.random()}`, testData, 300);
      },
      { iterations: 100, warmupIterations: 5 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 50, "avgTime")).toBe(true);
    expect(assertPerformance(result, 100, "p95Time")).toBe(true);
  });

  it("cache get should complete within 30ms", async () => {
    await setCache("perf-get-key", { data: "test" }, 300);

    const result = await benchmark(
      "Cache Get",
      async () => {
        const value = await getCache("perf-get-key");
        expect(value).not.toBeNull();
      },
      { iterations: 100, warmupIterations: 5 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 30, "avgTime")).toBe(true);
    expect(assertPerformance(result, 60, "p95Time")).toBe(true);
  });

  it("cache delete should complete within 30ms", async () => {
    await setCache("perf-del-key", { data: "test" }, 300);

    const result = await benchmark(
      "Cache Delete",
      async () => {
        await deleteCache("perf-del-key");
        await setCache("perf-del-key", { data: "test" }, 300);
      },
      { iterations: 100, warmupIterations: 5 }
    );

    logBenchmarkResult(result);
    expect(assertPerformance(result, 30, "avgTime")).toBe(true);
    expect(assertPerformance(result, 60, "p95Time")).toBe(true);
  });

  it("should handle 100+ concurrent cache operations", async () => {
    const result = await benchmark(
      "Cache Concurrent 100",
      async () => {
        const key = `concurrent-${Math.random()}`;
        await setCache(key, { value: Math.random() }, 60);
        const value = await getCache(key);
        expect(value).not.toBeNull();
      },
      { iterations: 100, concurrency: 100, warmupIterations: 5 }
    );

    logBenchmarkResult(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(50);
  });
});
