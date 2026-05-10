"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";

interface CommentSectionProps {
  repoFullName: string;
}

interface RepoComment {
  id: string;
  content: string;
  createdAt: string | Date | null;
}

export function CommentSection({ repoFullName }: CommentSectionProps) {
  const [comments, setComments] = useState<RepoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/comments/${encodeURIComponent(repoFullName)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "加载评论失败" }));
          throw new Error(data.error || "加载评论失败");
        }
        const data = await response.json();
        if (!cancelled) {
          setComments(Array.isArray(data.comments) ? data.comments : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载评论失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [repoFullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(repoFullName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "评论失败，请先登录" }));
        throw new Error(data.error || "评论失败，请先登录");
      }
      const data = await response.json();
      setComments((items) => [data.comment, ...items]);
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <MessageSquare style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
          讨论
        </h3>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            暂无评论，来发表第一条吧！
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3"
                style={{
                  background: "var(--color-bg-page)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-body)" }}>
                  {comment.content}
                </p>
                {comment.createdAt && (
                  <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs mb-3" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="发表你的看法..."
            className="input flex-1"
            maxLength={2000}
          />
          <button type="submit" className="btn-primary" disabled={submitting} aria-label="发布评论">
            {submitting ? (
              <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
            ) : (
              <Send style={{ width: 14, height: 14 }} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
