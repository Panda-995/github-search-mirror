export type AIProvider = "claude" | "openai" | "gemini" | "deepseek" | "custom";

export interface AICustomConfig {
  provider: AIProvider;
  model?: string;
  apiEndpoint?: string;
  apiKey?: string;
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface AIRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

const DEFAULT_AI_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_MAX_TOKENS_TRANSLATE = 8192;
const DEFAULT_MAX_TOKENS_EXPLAIN = 2048;
const DEFAULT_MAX_TOKENS_NATURAL_LANGUAGE = 200;
const DEFAULT_README_MAX_LENGTH = 8000;
const DEFAULT_EXPLAIN_SUMMARY_MAX_LENGTH = 500;
const DEFAULT_AI_TIMEOUT_MS = 30000;

function getAITimeoutSignal() {
  const timeout = Number(process.env.AI_REQUEST_TIMEOUT ?? DEFAULT_AI_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeout)
    ? Math.min(Math.max(timeout, 1000), 120000)
    : DEFAULT_AI_TIMEOUT_MS;
  return AbortSignal.timeout(timeoutMs);
}

function getProviderConfig(provider: AIProvider, customConfig?: AICustomConfig) {
  switch (provider) {
    case "claude": {
      const apiKey = customConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for Claude provider");
      }
      return {
        baseUrl: customConfig?.apiEndpoint || "https://api.anthropic.com/v1",
        apiKey,
        model: customConfig?.model || process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
        headers: {
          "anthropic-version": "2023-06-01",
        },
      };
    }
    case "openai": {
      const apiKey = customConfig?.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required for OpenAI provider");
      }
      return {
        baseUrl: customConfig?.apiEndpoint || "https://api.openai.com/v1",
        apiKey,
        model: customConfig?.model || process.env.OPENAI_MODEL || "gpt-4o",
      };
    }
    case "gemini": {
      const apiKey = customConfig?.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is required for Gemini provider");
      }
      return {
        baseUrl: customConfig?.apiEndpoint || "https://generativelanguage.googleapis.com/v1beta",
        apiKey,
        model: customConfig?.model || process.env.GEMINI_MODEL || "gemini-1.5-pro",
      };
    }
    case "deepseek": {
      const apiKey = customConfig?.apiKey || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is required for DeepSeek provider");
      }
      return {
        baseUrl: customConfig?.apiEndpoint || "https://api.deepseek.com/v1",
        apiKey,
        model: customConfig?.model || process.env.DEEPSEEK_MODEL || "deepseek-chat",
      };
    }
    case "custom": {
      const baseUrl = customConfig?.apiEndpoint || process.env.CUSTOM_AI_BASE_URL;
      const apiKey = customConfig?.apiKey || process.env.CUSTOM_AI_API_KEY;
      if (!baseUrl) {
        throw new Error("CUSTOM_AI_BASE_URL is required for custom provider");
      }
      if (!apiKey) {
        throw new Error("CUSTOM_AI_API_KEY is required for custom provider");
      }
      return {
        baseUrl,
        apiKey,
        model: customConfig?.model || "custom",
      };
    }
  }
}

export async function callAI(
  provider: AIProvider = "claude",
  request: AIRequest,
  customConfig?: AICustomConfig
): Promise<AIResponse> {
  const config = getProviderConfig(provider, customConfig);
  const systemPrompt = request.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const chatMessages = request.messages.filter((message) => message.role !== "system");

  if (provider === "claude") {
    const res = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      signal: getAITimeoutSignal(),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        ...config.headers,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: systemPrompt || undefined,
        messages: chatMessages,
        temperature: request.temperature ?? DEFAULT_AI_TEMPERATURE,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`AI API error (${provider}): ${res.status} ${error}`);
    }

    const data = await res.json();
    return {
      content: data.content?.[0]?.text ?? "",
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  if (provider === "gemini") {
    const res = await fetch(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        signal: getAITimeoutSignal(),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents: chatMessages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: request.temperature ?? DEFAULT_AI_TEMPERATURE,
            maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
          },
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`AI API error (${provider}): ${res.status} ${error}`);
    }

    const data = await res.json();
    const content =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";

    return {
      content,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount ?? 0,
            completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: data.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
    };
  }

  const body = {
    model: config.model,
    messages: request.messages,
    temperature: request.temperature ?? DEFAULT_AI_TEMPERATURE,
    max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
  };

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    signal: getAITimeoutSignal(),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`AI API error (${provider}): ${res.status} ${error}`);
  }

  const data = await res.json();

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

export async function translateReadme(
  readme: string,
  provider: AIProvider = "claude",
  customConfig?: AICustomConfig
): Promise<string> {
  const response = await callAI(
    provider,
    {
      messages: [
        {
          role: "system",
          content:
            "You are a technical translator. Translate the following README to Chinese. Keep all code blocks, URLs, and technical terms unchanged. Output only the translated text.",
        },
        { role: "user", content: readme },
      ],
      maxTokens: DEFAULT_MAX_TOKENS_TRANSLATE,
    },
    customConfig
  );
  return response.content;
}

export async function explainProject(
  repoName: string,
  description: string,
  readme: string,
  provider: AIProvider = "claude",
  customConfig?: AICustomConfig
): Promise<{
  summary: string;
  techStack: string[];
  difficulty: string;
  alternatives: string[];
}> {
  const response = await callAI(
    provider,
    {
      messages: [
        {
          role: "system",
          content:
            "请阅读以下 GitHub 项目的 README 内容，并生成一份项目介绍。要求：\n" +
            "1) 用 2-3 句话概括项目的主要功能和用途（中文）\n" +
            "2) 列出项目使用的主要技术栈（JSON 数组格式）\n" +
            "3) 评估项目的上手难度（Beginner/Intermediate/Advanced）\n" +
            "4) 推荐 2-3 个类似的替代项目（JSON 数组格式）\n" +
            "请严格返回以下 JSON 格式，不要包含其他内容：\n" +
            '{"summary": "项目介绍", "techStack": ["技术1", "技术2"], "difficulty": "Intermediate", "alternatives": ["替代项目1", "替代项目2"]}',
        },
        {
          role: "user",
          content: `项目名称: ${repoName}\n项目描述: ${description || "无"}\n\nREADME 内容:\n${readme.slice(0, DEFAULT_README_MAX_LENGTH)}`,
        },
      ],
      maxTokens: DEFAULT_MAX_TOKENS_EXPLAIN,
    },
    customConfig
  );

  try {
    const parsed = JSON.parse(response.content);
    return {
      summary: parsed.summary ?? "",
      techStack: parsed.techStack ?? [],
      difficulty: parsed.difficulty ?? "Intermediate",
      alternatives: parsed.alternatives ?? [],
    };
  } catch {
    return {
      summary: response.content.slice(0, DEFAULT_EXPLAIN_SUMMARY_MAX_LENGTH),
      techStack: [],
      difficulty: "Intermediate",
      alternatives: [],
    };
  }
}

export async function naturalLanguageToQuery(
  query: string,
  provider: AIProvider = "claude",
  customConfig?: AICustomConfig
): Promise<string> {
  const response = await callAI(
    provider,
    {
      messages: [
        {
          role: "system",
          content:
            "Convert natural language to GitHub search syntax. Only output the search query, no explanation. Examples: 'popular react component libraries' -> 'react components stars:>1000', 'python machine learning frameworks' -> 'python machine learning stars:>500'",
        },
        { role: "user", content: query },
      ],
      maxTokens: DEFAULT_MAX_TOKENS_NATURAL_LANGUAGE,
    },
    customConfig
  );
  return response.content.trim();
}

export async function explainCode(
  code: string,
  language: string,
  provider: AIProvider = "claude",
  customConfig?: AICustomConfig
): Promise<string> {
  const response = await callAI(
    provider,
    {
      messages: [
        {
          role: "system",
          content:
            "Explain the following code in Chinese. Be concise but thorough. Focus on what the code does and why.",
        },
        {
          role: "user",
          content: `Language: ${language}\n\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
      maxTokens: 2048,
    },
    customConfig
  );
  return response.content;
}
