"use server";

import { db, ensureCommentsSchema } from "@/db";
import { comments } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const REPO_FULL_NAME_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const COMMENT_MAX_LENGTH = 2000;

function assertRepoFullName(repoFullName: string) {
  if (!REPO_FULL_NAME_PATTERN.test(repoFullName)) {
    throw new Error("Invalid repository name");
  }
}

export async function getComments(repoFullName: string) {
  assertRepoFullName(repoFullName);
  await ensureCommentsSchema();

  return db
    .select()
    .from(comments)
    .where(and(eq(comments.repoFullName, repoFullName), eq(comments.isDeleted, false)))
    .orderBy(desc(comments.isPinned), desc(comments.createdAt))
    .limit(1000);
}

export async function addComment(data: {
  repoFullName: string;
  content: string;
  rating?: number;
  userId: string;
  parentId?: string | null;
}) {
  const content = data.content.trim();
  if (!content || content.length > COMMENT_MAX_LENGTH) {
    throw new Error("Invalid comment content");
  }
  assertRepoFullName(data.repoFullName);
  await ensureCommentsSchema();

  const result = await db
    .insert(comments)
    .values({
      repoFullName: data.repoFullName,
      content,
      rating: data.rating ?? null,
      userId: data.userId,
      parentId: data.parentId ?? null,
    })
    .returning();

  revalidatePath(`/repo/${data.repoFullName}`);
  return result[0];
}

export async function deleteComment(userId: string, commentId: string) {
  await ensureCommentsSchema();
  await db
    .update(comments)
    .set({ isDeleted: true })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}
