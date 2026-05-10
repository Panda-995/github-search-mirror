import "server-only";

import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";

export async function getGitHubTokenForUser(userId: string | null | undefined) {
  if (!userId) return undefined;

  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const token = result[0]?.githubToken;
    return typeof token === "string" && token.trim() ? token.trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function getCurrentGitHubToken() {
  const session = await getServerSession(authOptions);
  return getGitHubTokenForUser(session?.user?.id);
}
