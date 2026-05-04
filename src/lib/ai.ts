export type AIProvider = "claude" | "openai" | "deepseek" | "custom";

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

function getProviderConfig(provider: AIProvider) {
  switch (provider) {
    case "claude": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for Claude provider");
      }
      return {
        baseUrl: "https://api.anthropic.com/v1",
        apiKey,
        model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
        headers: {
          "anthropic-version": "2023-06-01",
        },
      };
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required for OpenAI provider");
      }
      return {
        baseUrl: "https://api.openai.com/v1",
        apiKey,
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
      };
    }
    case "deepseek": {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is required for DeepSeek provider");
      }
      return {
        baseUrl: "https://api.deepseek.com/v1",
        apiKey,
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      };
    }
    case "custom": {
      const baseUrl = process.env.CUSTOM_AI_BASE_URL;
      const apiKey = process.env.CUSTOM_AI_API_KEY;
      if (!baseUrl) {
        throw new Error("CUSTOM_AI_BASE_URL is required for custom provider");
      }
      if (!apiKey) {
        throw new Error("CUSTOM_AI_API_KEY is required for custom provider");
      }
      return {
        baseUrl,
        apiKey,
        model: "custom",
      };
    }
  }
}

export async function callAI(
  provider: AIProvider = "claude",
  request: AIRequest
): Promise<AIResponse> {
  const config = getProviderConfig(provider);

  const isAnthropic = provider === "claude";
  const url = isAnthropic
    ? `${config.baseUrl}/messages`
    : `${config.baseUrl}/chat/completions`;

  const body = isAnthropic
    ? {
        model: config.model,
        max_tokens: request.maxTokens ?? 4096,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
      }
    : {
        model: config.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      };

  const res = await fetch(url, {
    method: "POST",
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

  if (isAnthropic) {
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
  provider: AIProvider = "claude"
): Promise<string> {
  const response = await callAI(provider, {
    messages: [
      {
        role: "system",
        content:
          "You are a technical translator. Translate the following README to Chinese. Keep all code blocks, URLs, and technical terms unchanged. Output only the translated text.",
      },
      { role: "user", content: readme },
    ],
    maxTokens: 8192,
  });
  return response.content;
}

export async function explainProject(
  repoName: string,
  description: string,
  readme: string,
  provider: AIProvider = "claude"
): Promise<{
  summary: string;
  techStack: string[];
  difficulty: string;
  alternatives: string[];
}> {
  const response = await callAI(provider, {
    messages: [
      {
        role: "system",
        content:
          "Analyze this GitHub project and provide: 1) One-sentence summary in Chinese, 2) Tech stack as JSON array, 3) Difficulty level (Beginner/Intermediate/Advanced), 4) Alternative projects as JSON array. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Project: ${repoName}\nDescription: ${description}\nREADME excerpt: ${readme.slice(0, 3000)}`,
      },
    ],
    maxTokens: 2048,
  });

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
      summary: response.content.slice(0, 200),
      techStack: [],
      difficulty: "Intermediate",
      alternatives: [],
    };
  }
}

export async function naturalLanguageToQuery(
  query: string,
  provider: AIProvider = "claude"
): Promise<string> {
  const response = await callAI(provider, {
    messages: [
      {
        role: "system",
        content:
          "Convert natural language to GitHub search syntax. Only output the search query, no explanation. Examples: 'popular react component libraries' -> 'react components stars:>1000', 'python machine learning frameworks' -> 'python machine learning stars:>500'",
      },
      { role: "user", content: query },
    ],
    maxTokens: 200,
  });
  return response.content.trim();
}

export async function explainCode(
  code: string,
  language: string,
  provider: AIProvider = "claude"
): Promise<string> {
  const response = await callAI(provider, {
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
  });
  return response.content;
}
