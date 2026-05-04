"use server";

import { db } from "@/db";
import { collections, favorites, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserByGithubId(githubId: string) {
  const result = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
  return result[0] ?? null;
}

export async function createOrUpdateUser(data: {
  githubId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  githubToken: string | null;
}) {
  const existing = await getUserByGithubId(data.githubId);

  if (existing) {
    await db
      .update(users)
      .set({
        email: data.email ?? existing.email,
        name: data.name ?? existing.name,
        avatar: data.avatar ?? existing.avatar,
        githubToken: data.githubToken ?? existing.githubToken,
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }

  const result = await db
    .insert(users)
    .values({
      githubId: data.githubId,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      githubToken: data.githubToken,
    })
    .returning({ id: users.id });

  return result[0].id;
}

export async function getCollections(userId: string) {
  return db.select().from(collections).where(eq(collections.userId, userId));
}

export async function createCollection(userId: string, name: string, isPublic = false) {
  const result = await db
    .insert(collections)
    .values({ name, isPublic, userId })
    .returning();
  revalidatePath("/dashboard/collections");
  return result[0];
}

export async function deleteCollection(userId: string, collectionId: string) {
  await db
    .delete(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
  revalidatePath("/dashboard/collections");
}

export async function getFavorites(userId: string, collectionId?: string) {
  if (collectionId) {
    return db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.collectionId, collectionId)));
  }
  return db.select().from(favorites).where(eq(favorites.userId, userId));
}

export async function addFavorite(
  userId: string,
  collectionId: string,
  repoFullName: string,
  repoMeta?: Record<string, unknown>
) {
  const result = await db
    .insert(favorites)
    .values({
      userId,
      collectionId,
      repoFullName,
      repoMeta: repoMeta ?? {},
    })
    .returning();
  revalidatePath("/dashboard/collections");
  return result[0];
}

export async function removeFavorite(userId: string, favoriteId: string) {
  await db
    .delete(favorites)
    .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));
  revalidatePath("/dashboard/collections");
}
