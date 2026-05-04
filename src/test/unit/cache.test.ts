import { describe, it, expect, beforeEach } from "vitest";
import { mockRedis } from "@/test/mocks/redis";
import { getCache, setCache, deleteCache } from "@/lib/cache";

describe("Cache operations", () => {
  beforeEach(() => {
    mockRedis.reset();
  });

  it("should return null for non-existent key", async () => {
    const result = await getCache("non-existent");
    expect(result).toBeNull();
  });

  it("should set and get cached value", async () => {
    const data = { foo: "bar", count: 42 };
    await setCache("test-key", data, 300);

    const result = await getCache<typeof data>("test-key");
    expect(result).toEqual(data);
  });

  it("should delete cached value", async () => {
    await setCache("delete-key", "value", 300);
    await deleteCache("delete-key");

    const result = await getCache("delete-key");
    expect(result).toBeNull();
  });

  it("should cache search results", async () => {
    const searchResult = {
      total: 100,
      results: [{ full_name: "test/repo" }],
    };
    await setCache("search:react", searchResult, 300);

    const cached = await getCache<typeof searchResult>("search:react");
    expect(cached).toEqual(searchResult);
    expect(cached?.total).toBe(100);
  });

  it("should handle complex nested objects", async () => {
    const complexData = {
      facets: {
        language: [{ name: "TypeScript", count: 50 }],
        license: [{ name: "MIT", count: 30 }],
      },
      page: 1,
      per_page: 20,
    };
    await setCache("complex", complexData, 300);

    const result = await getCache<typeof complexData>("complex");
    expect(result?.facets.language[0].name).toBe("TypeScript");
  });
});
