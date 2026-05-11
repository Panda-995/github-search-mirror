"use server";

import { db, ensureCommentsSchema } from "@/db";
import { favorites, searchHistory, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("无权访问");
  }
}

export async function getAdminAnalytics() {
  await assertAdmin();
  await ensureCommentsSchema();

  const [allUsers, allFavorites, allSearches] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt),
    db.select().from(favorites).orderBy(favorites.createdAt),
    db.select().from(searchHistory).orderBy(searchHistory.createdAt),
  ]);

  const keywordCounts = new Map<string, number>();
  for (const item of allSearches) {
    const query = typeof item.query === "string" ? item.query.trim() : "";
    if (!query) continue;
    keywordCounts.set(query, (keywordCounts.get(query) ?? 0) + 1);
  }

  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([query, count]) => ({ query, count }));

  return {
    searches: allSearches.length,
    users: allUsers.length,
    favorites: allFavorites.length,
    topKeywords,
  };
}