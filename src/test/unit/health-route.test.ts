import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkDatabaseHealth } from "@/db";
import { getReadyRedis } from "@/lib/cache";
import { meiliClient } from "@/lib/search";
import { GET } from "@/app/api/health/route";

vi.mock("@/db", () => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  getReadyRedis: vi.fn(),
}));

vi.mock("@/lib/search", () => ({
  meiliClient: {
    health: vi.fn(),
  },
}));

describe("health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays healthy when optional services are degraded", async () => {
    vi.mocked(checkDatabaseHealth).mockResolvedValue({ ok: true, mode: "postgres" });
    vi.mocked(getReadyRedis).mockResolvedValue(null);
    vi.mocked(meiliClient.health).mockRejectedValue(new Error("search unavailable"));

    const response = await GET(new Request("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.status).toBe("degraded");
    expect(body.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "database", ok: true, required: true }),
        expect.objectContaining({ name: "redis", ok: false, required: false }),
        expect.objectContaining({ name: "search", ok: false, required: false }),
      ])
    );
  });

  it("can enforce strict dependency health when requested", async () => {
    vi.mocked(checkDatabaseHealth).mockResolvedValue({ ok: true, mode: "postgres" });
    vi.mocked(getReadyRedis).mockResolvedValue(null);
    vi.mocked(meiliClient.health).mockResolvedValue({ status: "available" });

    const response = await GET(new Request("http://localhost/api/health?strict=true"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.status).toBe("degraded");
  });

  it("fails when the required database check fails", async () => {
    vi.mocked(checkDatabaseHealth).mockRejectedValue(new Error("database unavailable"));
    vi.mocked(getReadyRedis).mockResolvedValue({
      ping: vi.fn().mockResolvedValue("PONG"),
    } as never);
    vi.mocked(meiliClient.health).mockResolvedValue({ status: "available" });

    const response = await GET(new Request("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.status).toBe("down");
  });
});
