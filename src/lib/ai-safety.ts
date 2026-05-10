import type { AIProvider } from "./ai";

export const AI_PROVIDERS: AIProvider[] = ["claude", "openai", "gemini", "deepseek", "custom"];

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);
const PRIVATE_HOST_PATTERNS = [
  /^127\./,
  /^10\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/,
  /^\[?fc/i,
  /^\[?fd/i,
  /^\[?fe80:/i,
];

export function parseAIProvider(value: unknown): AIProvider {
  return AI_PROVIDERS.includes(value as AIProvider) ? (value as AIProvider) : "claude";
}

export function assertSafeAIEndpoint(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("AI API 端点格式无效");
  }

  if (url.protocol !== "https:") {
    throw new Error("AI API 端点必须使用 HTTPS");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith(".local") ||
    PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))
  ) {
    throw new Error("AI API 端点不能指向本机或内网地址");
  }

  return url.origin + url.pathname.replace(/\/$/, "");
}

export function sanitizeAIConfig(input: {
  provider?: unknown;
  model?: unknown;
  apiEndpoint?: unknown;
  apiKey?: unknown;
}) {
  const provider = parseAIProvider(input.provider);
  const model = typeof input.model === "string" ? input.model.trim().slice(0, 128) : "";
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim().slice(0, 4096) : "";
  const rawEndpoint =
    typeof input.apiEndpoint === "string" ? input.apiEndpoint.trim().slice(0, 512) : "";
  const apiEndpoint = rawEndpoint ? assertSafeAIEndpoint(rawEndpoint) : "";

  return {
    provider,
    model,
    apiEndpoint,
    apiKey,
  };
}
