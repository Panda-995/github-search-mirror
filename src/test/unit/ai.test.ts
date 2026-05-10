import { describe, it, expect } from "vitest";
import {
  callAI,
  translateReadme,
  explainProject,
  naturalLanguageToQuery,
  explainCode,
} from "@/lib/ai";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AI Provider Config", () => {
  it("should throw error when ANTHROPIC_API_KEY is missing", async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "";

    await expect(
      callAI("claude", { messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("ANTHROPIC_API_KEY is required for Claude provider");

    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("should throw error when OPENAI_API_KEY is missing", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";

    await expect(
      callAI("openai", { messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("OPENAI_API_KEY is required for OpenAI provider");

    process.env.OPENAI_API_KEY = originalKey;
  });

  it("should throw error when DEEPSEEK_API_KEY is missing", async () => {
    const originalKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "";

    await expect(
      callAI("deepseek", { messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("DEEPSEEK_API_KEY is required for DeepSeek provider");

    process.env.DEEPSEEK_API_KEY = originalKey;
  });

  it("should throw error when custom provider URL is missing", async () => {
    const originalUrl = process.env.CUSTOM_AI_BASE_URL;
    const originalKey = process.env.CUSTOM_AI_API_KEY;
    process.env.CUSTOM_AI_BASE_URL = "";
    process.env.CUSTOM_AI_API_KEY = "test";

    await expect(
      callAI("custom", { messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("CUSTOM_AI_BASE_URL is required for custom provider");

    process.env.CUSTOM_AI_BASE_URL = originalUrl;
    process.env.CUSTOM_AI_API_KEY = originalKey;
  });
});

describe("callAI", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should call Claude API with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: "Hello" }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });

    const result = await callAI("claude", {
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": expect.any(String),
          "anthropic-version": "2023-06-01",
        }),
      })
    );
    expect(result.content).toBe("Hello");
    expect(result.usage?.totalTokens).toBe(15);
  });

  it("should call OpenAI API with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const result = await callAI("openai", {
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.any(Object)
    );
    expect(result.content).toBe("Hello");
  });

  it("should throw on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "Rate limited",
    });

    await expect(
      callAI("claude", { messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("AI API error (claude): 429 Rate limited");
  });
});

describe("translateReadme", () => {
  it("should return translated content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: "翻译后的内容" }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    });

    const result = await translateReadme("# Hello World", "claude");
    expect(result).toBe("翻译后的内容");
  });
});

describe("explainProject", () => {
  it("should parse JSON response correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            text: '{"summary": "A React framework", "techStack": ["React", "TypeScript"], "difficulty": "Intermediate", "alternatives": ["Vue", "Angular"]}',
          },
        ],
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    });

    const result = await explainProject("nextjs", "React framework", "# Next.js");
    expect(result.summary).toBe("A React framework");
    expect(result.techStack).toContain("React");
    expect(result.difficulty).toBe("Intermediate");
    expect(result.alternatives).toContain("Vue");
  });

  it("should handle invalid JSON gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: "This is not JSON" }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });

    const result = await explainProject("test", "desc", "readme");
    expect(result.summary).toBe("This is not JSON");
    expect(result.techStack).toEqual([]);
  });
});

describe("naturalLanguageToQuery", () => {
  it("should convert natural language to GitHub query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: "react components stars:>1000" }],
        usage: { input_tokens: 20, output_tokens: 10 },
      }),
    });

    const result = await naturalLanguageToQuery("popular react component libraries");
    expect(result).toBe("react components stars:>1000");
  });
});

describe("explainCode", () => {
  it("should explain code in Chinese", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: "这段代码定义了一个函数..." }],
        usage: { input_tokens: 30, output_tokens: 20 },
      }),
    });

    const result = await explainCode("function hello() { return 'world'; }", "javascript");
    expect(result).toContain("这段代码");
  });
});
