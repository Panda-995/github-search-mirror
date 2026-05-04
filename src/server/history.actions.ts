"use server";

import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function saveSearchHistory(
  userId: string | null,
  query: string,
  filters?: Record<string, unknown>
) {
  if (!query.trim()) return;

  await db.insert(searchHistory).values({
    query: query.trim(),
    filters: filters ?? {},
    userId,
  });
}

export async function getSearchHistory(userId: string, limit = 50) {
  return db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

export async function clearSearchHistory(userId: string) {
  await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
}
