"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeAIConfig } from "@/lib/ai-safety";
import { decryptSecret, encryptSecret, normalizeSecretForStorage } from "@/lib/secret-crypto";
import { isDatabaseErrorMessage } from "@/lib/api-guard";

export interface AIConfig {
  provider: string;
  model: string;
  apiEndpoint: string;
  apiKey: string;
  apiKeyConfigured?: boolean;
  clearApiKey?: boolean;
}

export interface UserSettings {
  name: string;
  githubToken: string;
  githubTokenConfigured?: boolean;
  clearGithubToken?: boolean;
  aiConfig: AIConfig;
}

interface StoredAIConfig {
  provider?: unknown;
  model?: unknown;
  apiEndpoint?: unknown;
  apiKey?: unknown;
}

function asStoredAIConfig(value: unknown): StoredAIConfig {
  return value && typeof value === "object" ? (value as StoredAIConfig) : {};
}

function getStoredString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function hasSecret(value: string | null | undefined) {
  return Boolean(decryptSecret(value));
}

function toPublicAIConfig(value: unknown): AIConfig {
  const stored = asStoredAIConfig(value);
  const apiKey = getStoredString(stored.apiKey);

  return {
    provider: getStoredString(stored.provider) || "claude",
    model: getStoredString(stored.model),
    apiEndpoint: getStoredString(stored.apiEndpoint),
    apiKey: "",
    apiKeyConfigured: hasSecret(apiKey),
  };
}

function toSettingsActionError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (isDatabaseErrorMessage(message)) {
    return "数据库服务暂时不可用，请检查 DATABASE_URL、PostgreSQL 服务或数据库迁移是否已执行。";
  }
  return message || fallback;
}

export async function getUserSettings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    const user = result[0];
    if (!user) return null;

    return {
      name: user.name ?? "",
      githubToken: "",
      githubTokenConfigured: hasSecret(user.githubToken),
      aiConfig: toPublicAIConfig(user.aiConfig),
    };
  } catch (error) {
    throw new Error(toSettingsActionError(error, "获取设置失败"));
  }
}

export async function updateUserSettings(settings: UserSettings) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  try {
    const existingResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const existingUser = existingResult[0];
    if (!existingUser) {
      throw new Error("用户不存在");
    }

    const githubToken = settings.githubToken.trim();
    if (githubToken.length > 4096) {
      throw new Error("GitHub Token 过长");
    }

    const aiConfig = sanitizeAIConfig(settings.aiConfig);
    const existingAIConfig = asStoredAIConfig(existingUser.aiConfig);
    const existingAIKey = getStoredString(existingAIConfig.apiKey);
    const nextGitHubToken = settings.clearGithubToken
      ? null
      : githubToken
        ? encryptSecret(githubToken)
        : normalizeSecretForStorage(existingUser.githubToken);
    const nextAIKey = settings.aiConfig.clearApiKey
      ? ""
      : aiConfig.apiKey
        ? encryptSecret(aiConfig.apiKey)
        : (normalizeSecretForStorage(existingAIKey) ?? "");
    const name = settings.name.trim().slice(0, 255);

    await db
      .update(users)
      .set({
        name: name || null,
        githubToken: nextGitHubToken,
        aiConfig: {
          ...aiConfig,
          apiKey: nextAIKey,
        },
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return {
      success: true,
      githubTokenConfigured: hasSecret(nextGitHubToken),
      aiApiKeyConfigured: hasSecret(nextAIKey),
    };
  } catch (error) {
    throw new Error(toSettingsActionError(error, "保存设置失败"));
  }
}

export async function updateUserName(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  try {
    await db
      .update(users)
      .set({ name: name || null })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    throw new Error("保存用户名失败");
  }
}
