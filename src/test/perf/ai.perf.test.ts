import { describe, it, expect, vi, beforeEach } from "vitest";
import { benchmark, assertPerformance } from "./benchmark";
import {
  callAI,
  translateReadme,
  explainProject,
  naturalLanguageToQuery,
  explainCode,
} from "@/lib/ai";

describe("AI Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AI call should complete within 10s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 100));
      return {
        ok: true,
        json: async () => ({
          content: [{ text: "Test response" }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      };
    });

    const result = await benchmark(
      "AI Call (Claude)",
      async () => {
        const res = await callAI("claude", {
          messages: [{ role: "user", content: "Hello" }],
        });
        expect(res.content).toBe("Test response");
      },
      { iterations: 20, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 10000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 15000, "p95Time")).toBe(true);
  });

  it("translateReadme should complete within 10s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 150));
      return {
        ok: true,
        json: async () => ({
          content: [{ text: "翻译后的README内容" }],
          usage: { input_tokens: 500, output_tokens: 400 },
        }),
      };
    });

    const readme = "# React\nA JavaScript library for building user interfaces.";

    const result = await benchmark(
      "AI Translate Readme",
      async () => {
        const res = await translateReadme(readme, "claude");
        expect(res).toContain("翻译");
      },
      { iterations: 10, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 10000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 15000, "p95Time")).toBe(true);
  });

  it("explainProject should complete within 10s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 120));
      return {
        ok: true,
        json: async () => ({
          content: [
            {
              text: JSON.stringify({
                summary: "一个React项目",
                techStack: ["React", "TypeScript"],
                difficulty: "Intermediate",
                alternatives: ["Vue", "Angular"],
              }),
            },
          ],
          usage: { input_tokens: 300, output_tokens: 200 },
        }),
      };
    });

    const result = await benchmark(
      "AI Explain Project",
      async () => {
        const res = await explainProject("facebook/react", "A JS library", "# React");
        expect(res.summary).toBe("一个React项目");
      },
      { iterations: 10, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 10000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 15000, "p95Time")).toBe(true);
  });

  it("naturalLanguageToQuery should complete within 10s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return {
        ok: true,
        json: async () => ({
          content: [{ text: "react stars:>1000" }],
          usage: { input_tokens: 50, output_tokens: 10 },
        }),
      };
    });

    const result = await benchmark(
      "AI NL to Query",
      async () => {
        const res = await naturalLanguageToQuery("popular react libraries");
        expect(res).toContain("react");
      },
      { iterations: 20, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 10000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 15000, "p95Time")).toBe(true);
  });

  it("explainCode should complete within 10s", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 100));
      return {
        ok: true,
        json: async () => ({
          content: [{ text: "这段代码定义了一个函数..." }],
          usage: { input_tokens: 200, output_tokens: 150 },
        }),
      };
    });

    const code = "function add(a, b) { return a + b; }";

    const result = await benchmark(
      "AI Explain Code",
      async () => {
        const res = await explainCode(code, "javascript");
        expect(res.length).toBeGreaterThan(0);
      },
      { iterations: 15, warmupIterations: 2 }
    );

    console.log(result);
    expect(assertPerformance(result, 10000, "avgTime")).toBe(true);
    expect(assertPerformance(result, 15000, "p95Time")).toBe(true);
  });

  it("should handle concurrent AI requests", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return {
        ok: true,
        json: async () => ({
          content: [{ text: "Response" }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };
    });

    const result = await benchmark(
      "AI Concurrent 50",
      async () => {
        const res = await callAI("claude", {
          messages: [{ role: "user", content: "Hi" }],
        });
        expect(res.content).toBe("Response");
      },
      { iterations: 50, concurrency: 50, warmupIterations: 3 }
    );

    console.log(result);
    expect(result.success).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.throughput).toBeGreaterThan(5);
  });
});
