import "server-only";

import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { decryptSecret } from "@/lib/secret-crypto";
import type { AIProvider, AICustomConfig } from "./ai";
import { assertSafeAIEndpoint, parseAIProvider } from "./ai-safety";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";

interface StoredAIConfig {
  provider?: unknown;
  model?: unknown;
  apiEndpoint?: unknown;
  apiKey?: unknown;
}

function asStoredAIConfig(value: unknown): StoredAIConfig | null {
  return value && typeof value === "object" ? (value as StoredAIConfig) : null;
}

async function getStoredAIConfig() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const result = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  return asStoredAIConfig(result[0]?.aiConfig);
}

export async function getUserAIConfig(): Promise<{
  provider: AIProvider;
  customConfig?: AICustomConfig;
}> {
  const aiConfig = await getStoredAIConfig();

  const provider = parseAIProvider(aiConfig?.provider);
  const apiKey = decryptSecret(typeof aiConfig?.apiKey === "string" ? aiConfig.apiKey : "");
  const model = typeof aiConfig?.model === "string" ? aiConfig.model : "";
  const apiEndpoint = typeof aiConfig?.apiEndpoint === "string" ? aiConfig.apiEndpoint : "";
  const customConfig: AICustomConfig | undefined = aiConfig
    ? {
        provider,
        model: model || undefined,
        apiEndpoint: apiEndpoint ? assertSafeAIEndpoint(apiEndpoint) : undefined,
        apiKey: apiKey || undefined,
      }
    : undefined;

  return { provider, customConfig };
}
