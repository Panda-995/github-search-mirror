import { db } from "@/db";
import { comments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MessageSquare, Pin, Trash2 } from "lucide-react";

export default async function CommentsPage() {
  const allComments = await db
    .select()
    .from(comments)
    .orderBy(desc(comments.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">评论审核</h1>

      <div className="space-y-3">
        {allComments.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-lg border p-4 ${
              comment.isPinned ? "border-yellow-400 bg-yellow-50/50" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.repoFullName}</span>
                  {comment.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                      <Pin className="h-3 w-3" />
                      置顶
                    </span>
                  )}
                  {comment.isDeleted && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      已删除
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm">{comment.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {comment.createdAt
                    ? new Date(comment.createdAt).toLocaleDateString("zh-CN")
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md border p-2 text-muted-foreground hover:bg-muted">
                  <Pin className="h-4 w-4" />
                </button>
                <button className="rounded-md border p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {allComments.length === 0 && (
          <div className="rounded-lg border p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">暂无评论</p>
          </div>
        )}
      </div>
    </div>
  );
}
