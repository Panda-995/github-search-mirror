"use client";

import { useState } from "react";
import { MessageCircle, Send, ThumbsUp, User } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
  liked: boolean;
}

interface CommentSectionProps {
  repoFullName: string;
}

export function CommentSection({ repoFullName }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      // TODO: 接入后端 API
      // await fetch(`/api/comments/${encodeURIComponent(repoFullName)}`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ content: newComment.trim() }),
      // });

      const comment: Comment = {
        id: Date.now(),
        author: "匿名用户",
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        liked: false,
      };

      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = (commentId: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked }
          : c
      )
    );
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <MessageCircle style={{ width: 16, height: 16, color: "var(--surface-400)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--surface-700)" }}>
          评论
        </span>
        {comments.length > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--surface-100)", color: "var(--surface-500)" }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment form */}
      <div className="p-4" style={{ borderBottom: comments.length > 0 ? "1px solid var(--border-subtle)" : "none" }}>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div
              className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full"
              style={{ background: "var(--surface-100)" }}
            >
              <User style={{ width: 14, height: 14, color: "var(--surface-400)" }} />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-md resize-none outline-none"
                style={{
                  background: "rgba(250, 250, 250, 0.7)",
                  border: "1px solid var(--border-default)",
                  color: "var(--surface-900)",
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style={{
                    background: newComment.trim() ? "var(--accent-indigo)" : "var(--surface-200)",
                    color: newComment.trim() ? "white" : "var(--surface-400)",
                    cursor: newComment.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <Send style={{ width: 12, height: 12 }} />
                  发送
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments list */}
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {comments.map((comment) => (
          <div key={comment.id} className="p-4">
            <div className="flex gap-2">
              <div
                className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full"
                style={{ background: "var(--surface-100)" }}
              >
                <User style={{ width: 13, height: 13, color: "var(--surface-400)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--surface-700)" }}>
                    {comment.author}
                  </span>
                  <span className="text-xs" style={{ color: "var(--surface-400)" }}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--surface-600)" }}>
                  {comment.content}
                </p>
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 mt-2 text-xs transition-colors"
                  style={{
                    color: comment.liked ? "var(--accent-indigo)" : "var(--surface-400)",
                  }}
                >
                  <ThumbsUp style={{ width: 12, height: 12 }} />
                  {comment.likes > 0 ? comment.likes : "赞"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="p-6 text-center">
            <MessageCircle className="mx-auto h-6 w-6 mb-2" style={{ color: "var(--surface-300)" }} />
            <p className="text-sm" style={{ color: "var(--surface-400)" }}>
              暂无评论，来发表第一条吧
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
