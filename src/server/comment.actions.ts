"use server";

import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getComments(repoFullName: string) {
  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.repoFullName, repoFullName),
        eq(comments.isDeleted, false)
      )
    )
    .orderBy(desc(comments.isPinned), desc(comments.createdAt));
}

export async function addComment(data: {
  repoFullName: string;
  content: string;
  rating?: number;
  userId: string;
  parentId?: string | null;
}) {
  const result = await db
    .insert(comments)
    .values({
      repoFullName: data.repoFullName,
      content: data.content,
      rating: data.rating ?? null,
      userId: data.userId,
      parentId: data.parentId ?? null,
    })
    .returning();

  revalidatePath(`/repo/${data.repoFullName}`);
  return result[0];
}

export async function deleteComment(userId: string, commentId: string) {
  await db
    .update(comments)
    .set({ isDeleted: true })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}
