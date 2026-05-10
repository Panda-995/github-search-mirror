"use server";

import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function saveSearchHistory(
  userId: string | null | undefined,
  query: string,
  filters?: unknown
) {
  if (!query.trim()) return;
  if (!userId) return;

  try {
    await db
      .insert(searchHistory)
      .values({
        query: query.trim(),
        filters: filters ?? {},
        userId,
      })
      .returning();
  } catch {
    // Don't throw - search should work even if history fails
  }
}

export async function getSearchHistory(userId: string, limit = 50) {
  try {
    const result = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
    return result;
  } catch {
    return [];
  }
}

export async function clearSearchHistory(userId: string) {
  try {
    await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  } catch {
    throw new Error("清除历史记录失败");
  }
}
