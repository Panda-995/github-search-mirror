import { describe, expect, it } from "vitest";
import { assertSafeAIEndpoint, parseAIProvider, sanitizeAIConfig } from "@/lib/ai-safety";

describe("AI safety helpers", () => {
  it("allows HTTPS public endpoints", () => {
    expect(assertSafeAIEndpoint("https://api.example.com/v1/")).toBe("https://api.example.com/v1");
  });

  it("rejects local and private endpoints", () => {
    expect(() => assertSafeAIEndpoint("http://localhost:11434/v1")).toThrow();
    expect(() => assertSafeAIEndpoint("https://127.0.0.1/v1")).toThrow();
    expect(() => assertSafeAIEndpoint("https://192.168.1.5/v1")).toThrow();
  });

  it("falls back to a safe provider", () => {
    expect(parseAIProvider("not-a-provider")).toBe("claude");
  });

  it("sanitizes model and API key lengths", () => {
    const config = sanitizeAIConfig({
      provider: "openai",
      model: "x".repeat(200),
      apiKey: "k".repeat(5000),
    });

    expect(config.provider).toBe("openai");
    expect(config.model).toHaveLength(128);
    expect(config.apiKey).toHaveLength(4096);
  });
});
