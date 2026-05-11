import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, checkRateLimitAsync, resetRateLimitForTests } from "@/lib/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("blocks requests after the synchronous bucket limit", () => {
    expect(checkRateLimit("sync:test", { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit("sync:test", { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit("sync:test", { limit: 2, windowMs: 60_000 }).allowed).toBe(false);
  });

  it("falls back to the in-memory bucket when Redis is unavailable in tests", async () => {
    await expect(
      checkRateLimitAsync("async:test", { limit: 1, windowMs: 60_000 })
    ).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(
      checkRateLimitAsync("async:test", { limit: 1, windowMs: 60_000 })
    ).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });
});
