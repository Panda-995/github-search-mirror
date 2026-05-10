import { db } from "@/db";
import { comments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MessageSquare, Pin, Trash2 } from "lucide-react";
import { setCommentDeleted, setCommentPinned } from "@/server/admin.actions";

export default async function CommentsPage() {
  let allComments: (typeof comments.$inferSelect)[] = [];

  try {
    allComments = await db.select().from(comments).orderBy(desc(comments.createdAt));
  } catch {
    // Database not available, show empty state
    allComments = [];
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text-heading)" }}>
        评论审核
      </h1>

      <div className="space-y-3">
        {allComments.map((comment) => (
          <div
            key={comment.id}
            className="card"
            style={{
              padding: 16,
              ...(comment.isPinned ? { borderColor: "#FBBF24", background: "#FFFBEB" } : {}),
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium text-sm"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    {comment.repoFullName}
                  </span>
                  {comment.isPinned && (
                    <span
                      className="inline-flex items-center gap-1 badge"
                      style={{
                        background: "#FEF3C7",
                        color: "#D97706",
                      }}
                    >
                      <Pin style={{ width: 12, height: 12 }} />
                      置顶
                    </span>
                  )}
                  {comment.isDeleted && (
                    <span
                      className="badge"
                      style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                      }}
                    >
                      已删除
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-body)" }}>
                  {comment.content}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("zh-CN") : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={setCommentPinned.bind(null, comment.id, !comment.isPinned)}>
                  <button
                    type="submit"
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    title={comment.isPinned ? "取消置顶" : "置顶评论"}
                  >
                    <Pin style={{ width: 14, height: 14 }} />
                  </button>
                </form>
                <form action={setCommentDeleted.bind(null, comment.id, !comment.isDeleted)}>
                  <button
                    type="submit"
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    title={comment.isDeleted ? "恢复评论" : "删除评论"}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {allComments.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-12">
            <MessageSquare
              style={{ width: 32, height: 32, color: "var(--color-text-muted)" }}
              className="mb-3"
            />
            <p style={{ color: "var(--color-text-muted)" }}>暂无评论</p>
          </div>
        )}
      </div>
    </div>
  );
}
