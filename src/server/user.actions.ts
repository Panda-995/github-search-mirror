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

export async function getUserByGithubId(githubId: string) {
  try {
    const result = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
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

export async function createOrUpdateUser(data: {
  githubId: string;
  email: string | null;
  emailVerified?: boolean;
  name: string | null;
  avatar: string | null;
  githubToken: string | null;
}) {
  try {
    const email = data.email ? normalizeEmail(data.email) : null;
    const existing = await getUserByGithubId(data.githubId);

    if (existing) {
      await db
        .update(users)
        .set({
          email: email ?? existing.email,
          name: data.name ?? existing.name,
          avatar: data.avatar ?? existing.avatar,
          githubToken: data.githubToken ?? existing.githubToken,
        })
        .where(eq(users.id, existing.id));
      return existing.id;
    }

    const existingByEmail = email ? await getUserByEmail(email) : null;
    if (existingByEmail) {
      await db
        .update(users)
        .set({
          githubId: existingByEmail.githubId ?? data.githubId,
          name: data.name ?? existingByEmail.name,
          avatar: data.avatar ?? existingByEmail.avatar,
          githubToken: data.githubToken ?? existingByEmail.githubToken,
        })
        .where(eq(users.id, existingByEmail.id));
      return existingByEmail.id;
    }

    const result = await db
      .insert(users)
      .values({
        githubId: data.githubId,
        email,
        name: data.name,
        avatar: data.avatar,
        githubToken: data.githubToken,
        role: data.emailVerified ? getInitialRole(email) : "USER",
      })
      .returning({ id: users.id });

    return result[0].id;
  } catch {
    throw new Error("创建/更新用户失败");
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
      githubId: `email-${email}`,
      email,
      name: data.name?.trim() || email.split("@")[0],
      passwordHash: await hashPassword(data.password),
      role: "USER",
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
  try {
    const result = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, userId))
      .limit(1000);
    return result;
  } catch {
    return [];
  }
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
  } catch {
    throw new Error("删除收藏夹失败");
  }
}

export async function getFavorites(userId: string, collectionId?: string) {
  try {
    if (collectionId) {
      const result = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.collectionId, collectionId)))
        .limit(1000);
      return result;
    }
    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .limit(1000);
    return result;
  } catch {
    return [];
  }
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
    await db
      .delete(favorites)
      .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));
    revalidatePath("/dashboard/collections");
  } catch {
    throw new Error("移除收藏失败");
  }
}

export async function getFavoriteByRepo(userId: string, repoFullName: string) {
  try {
    const result = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.repoFullName, repoFullName)))
      .limit(1);
    return result[0] ?? null;
  } catch {
    return null;
  }
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
