"use client";

import { useState } from "react";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RepoItem } from "@/types";

interface AIRecommendationPanelProps {
  repos: RepoItem[];
  query?: string;
}

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 style={{ fontSize: "15px", fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ fontSize: "13px", fontWeight: 600, marginTop: 8, marginBottom: 4 }}>{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: 6 }}>{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ paddingLeft: 16, marginBottom: 6, fontSize: "13px", lineHeight: 1.6 }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ paddingLeft: 16, marginBottom: 6, fontSize: "13px", lineHeight: 1.6 }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginBottom: 2 }}>{children}</li>
  ),
};

export function AIRecommendationPanel({ repos, query }: AIRecommendationPanelProps) {
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRecommendation = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: repos.map((r) => ({
            full_name: r.full_name,
            name: r.name,
            owner: r.owner,
            description: r.description,
            stars: r.stars,
            language: r.language,
          })),
          query,
        }),
      });

      const data = await response.json().catch(() => ({ error: "请求失败" }));
      if (!response.ok) throw new Error(data.error || "请求失败");
      setRecommendation(data.recommendation || "暂无建议");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成选型建议失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden mt-6">
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Lightbulb style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
          AI 选型建议
        </h3>
      </div>

      <div className="p-5">
        {recommendation ? (
          <div className="max-h-96 overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {recommendation}
            </ReactMarkdown>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-xs mb-3" style={{ color: "var(--color-error)" }}>
                {error}
              </p>
            )}
            <button
              onClick={generateRecommendation}
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: 16, height: 16 }} />
                  生成选型建议
                </>
              )}
            </button>
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              基于当前搜索结果，AI 将分析并推荐最值得关注的项目
            </p>
          </>
        )}
      </div>
    </div>
  );
}