"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeAIConfig } from "@/lib/ai-safety";

export interface AIConfig {
  provider: string;
  model: string;
  apiEndpoint: string;
  apiKey: string;
}

export interface UserSettings {
  name: string;
  githubToken: string;
  aiConfig: AIConfig;
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

    const aiConfig = (user.aiConfig as AIConfig | null) ?? {
      provider: "claude",
      model: "",
      apiEndpoint: "",
      apiKey: "",
    };

    return {
      name: user.name ?? "",
      githubToken: user.githubToken ?? "",
      aiConfig,
    };
  } catch {
    return null;
  }
}

export async function updateUserSettings(settings: UserSettings) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  try {
    const githubToken = settings.githubToken.trim();
    if (githubToken.length > 4096) {
      throw new Error("GitHub Token 过长");
    }

    const aiConfig = sanitizeAIConfig(settings.aiConfig);
    const name = settings.name.trim().slice(0, 255);

    await db
      .update(users)
      .set({
        name: name || null,
        githubToken: githubToken || null,
        aiConfig,
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    throw new Error("保存设置失败: " + message);
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
