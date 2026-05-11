"use server";

import { db } from "@/db";
import { collections, favorites, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getInitialRole(email: string | null) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return email && adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "USER";
}

export async function getUserById(id: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(email)))
      .limit(1);
    return result[0] ?? null;
  } catch {
    return null;
  }
}

export async function createEmailUser(data: {
  email: string;
  password: string;
  name?: string | null;
}) {
  const email = normalizeEmail(data.email);
  const existing = await getUserByEmail(email);
  if (existing) {
    if (existing.passwordHash) {
      throw new Error("该邮箱已注册");
    }

    await db
      .update(users)
      .set({
        name: data.name?.trim() || existing.name || email.split("@")[0],
        passwordHash: await hashPassword(data.password),
        role: existing.role ?? getInitialRole(email),
      })
      .where(eq(users.id, existing.id));

    const upgraded = await getUserByEmail(email);
    if (!upgraded) throw new Error("该邮箱升级失败");
    return upgraded;
  }

  const result = await db
    .insert(users)
    .values({
      email,
      name: data.name?.trim() || email.split("@")[0],
      passwordHash: await hashPassword(data.password),
      role: getInitialRole(email),
    })
    .returning();

  return result[0];
}

export async function verifyEmailCredentials(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user?.passwordHash) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function getCollections(userId: string) {
  return db.select().from(collections).where(eq(collections.userId, userId)).limit(1000);
}

export async function getCollectionById(collectionId: string) {
  const result = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);
  return result[0] ?? null;
}

export async function getMyCollections() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return getCollections(session.user.id);
}

export async function createCollection(userId: string, name: string, isPublic = false) {
  try {
    const safeName = name.trim().slice(0, 80);
    if (!safeName) throw new Error("收藏夹名称不能为空");

    const result = await db
      .insert(collections)
      .values({ name: safeName, isPublic, userId })
      .returning();
    revalidatePath("/dashboard/collections");
    return result[0];
  } catch {
    throw new Error("创建收藏夹失败");
  }
}

export async function deleteCollection(userId: string, collectionId: string) {
  try {
    await db
      .delete(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
    revalidatePath("/dashboard/collections");
    revalidatePath(`/collection/${collectionId}`);
  } catch {
    throw new Error("删除收藏夹失败");
  }
}

export async function setCollectionVisibility(collectionId: string, isPublic: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("未登录");

  try {
    const existing = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)))
      .limit(1);
    if (!existing[0]) throw new Error("收藏夹不存在或无权访问");

    await db
      .update(collections)
      .set({ isPublic })
      .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)));
    revalidatePath("/dashboard/collections");
    revalidatePath(`/collection/${collectionId}`);
  } catch {
    throw new Error("更新收藏夹可见性失败");
  }
}

export async function getFavorites(userId: string, collectionId?: string) {
  if (collectionId) {
    return db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.collectionId, collectionId)))
      .limit(1000);
  }
  return db.select().from(favorites).where(eq(favorites.userId, userId)).limit(1000);
}

export async function getFavoritesByCollectionId(collectionId: string) {
  return db.select().from(favorites).where(eq(favorites.collectionId, collectionId)).limit(1000);
}

export async function addFavorite(
  userId: string,
  collectionId: string,
  repoFullName: string,
  repoMeta?: Record<string, unknown>
) {
  try {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) {
      throw new Error("仓库名称格式无效");
    }

    const collection = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
      .limit(1);
    if (!collection[0]) {
      throw new Error("收藏夹不存在或无权访问");
    }

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
    revalidatePath(`/collection/${collectionId}`);
    return result[0];
  } catch {
    throw new Error("添加收藏失败");
  }
}

export async function addFavoriteForUser(
  collectionId: string,
  repoFullName: string,
  repoMeta?: Record<string, unknown>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("未登录");
  return addFavorite(session.user.id, collectionId, repoFullName, repoMeta);
}

export async function removeFavorite(userId: string, favoriteId: string) {
  try {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)))
      .limit(1);

    await db
      .delete(favorites)
      .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));
    revalidatePath("/dashboard/collections");
    if (existing[0]?.collectionId) {
      revalidatePath(`/collection/${existing[0].collectionId}`);
    }
  } catch {
    throw new Error("移除收藏失败");
  }
}

export async function getFavoriteByRepo(userId: string, repoFullName: string) {
  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.repoFullName, repoFullName)))
    .limit(1);
  return result[0] ?? null;
}

export async function getFavoriteByRepoForUser(repoFullName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return getFavoriteByRepo(session.user.id, repoFullName);
}

export async function removeFavoriteByRepoForUser(repoFullName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("未登录");

  const favorite = await getFavoriteByRepo(session.user.id, repoFullName);
  if (!favorite) throw new Error("未收藏该项目");

  await removeFavorite(session.user.id, favorite.id);
  return { success: true };
}
