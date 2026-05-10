"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Sparkles, Loader2, Languages, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIPanelProps {
  repoFullName: string;
  readme: string;
  description: string;
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="readme-h1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="readme-h2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="readme-h3">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="readme-p">{children}</p>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="readme-a">
      {children}
    </a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="readme-code-inline">{children}</code>
    ) : (
      <pre className="readme-pre">
        <code className={className}>{children}</code>
      </pre>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="readme-ul">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="readme-ol">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="readme-li">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="readme-blockquote">{children}</blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="readme-table-wrapper">
      <table className="readme-table">{children}</table>
    </div>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} alt={props.alt || ""} className="readme-img" loading="lazy" />
  ),
  hr: () => <hr className="readme-hr" />,
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="readme-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function AIPanel({ repoFullName, readme, description }: AIPanelProps) {
  const [summary, setSummary] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "translate">("summary");

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: repoFullName, description, readme }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "生成摘要失败" }));
        throw new Error(data.error || "生成摘要失败");
      }
      const data = await response.json();
      setSummary(data.summary || "暂无摘要");
    } catch (err) {
      setSummary(err instanceof Error ? err.message : "生成摘要失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const translateReadme = async () => {
    if (!readme) return;
    setTranslating(true);
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName, readme }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "翻译失败" }));
        throw new Error(data.error || "翻译失败");
      }
      const data = await response.json();
      setTranslation(data.translation || "翻译失败");
    } catch (err) {
      setTranslation(err instanceof Error ? err.message : "翻译失败，请稍后重试");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Sparkles style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
          AI 助手
        </h3>
      </div>

      <div className="p-5">
        {/* Tab Switch */}
        <div className="tab-pill-container w-full mb-4">
          <button
            onClick={() => setActiveTab("summary")}
            className={`tab-pill flex-1 ${activeTab === "summary" ? "active" : ""}`}
          >
            <Sparkles style={{ width: 14, height: 14, marginRight: 4 }} />
            摘要
          </button>
          <button
            onClick={() => setActiveTab("translate")}
            className={`tab-pill flex-1 ${activeTab === "translate" ? "active" : ""}`}
          >
            <Languages style={{ width: 14, height: 14, marginRight: 4 }} />
            翻译
          </button>
        </div>

        {activeTab === "summary" && (
          <>
            {summary ? (
              <div className="max-h-80 overflow-y-auto">
                <MarkdownContent content={summary} />
                <button
                  onClick={() => {
                    setSummary("");
                    generateSummary();
                  }}
                  disabled={loading}
                  className="btn-ghost w-full justify-center mt-3 text-xs"
                >
                  {loading ? (
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  ) : (
                    <RotateCcw style={{ width: 14, height: 14 }} />
                  )}
                  重新生成
                </button>
              </div>
            ) : (
              <button
                onClick={generateSummary}
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: 16, height: 16 }} />
                    生成 AI 摘要
                  </>
                )}
              </button>
            )}
          </>
        )}

        {activeTab === "translate" && (
          <>
            {translation ? (
              <div className="max-h-80 overflow-y-auto">
                <MarkdownContent content={translation} />
                <button
                  onClick={() => {
                    setTranslation("");
                    translateReadme();
                  }}
                  disabled={translating}
                  className="btn-ghost w-full justify-center mt-3 text-xs"
                >
                  {translating ? (
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  ) : (
                    <RotateCcw style={{ width: 14, height: 14 }} />
                  )}
                  重新翻译
                </button>
              </div>
            ) : (
              <button
                onClick={translateReadme}
                disabled={translating || !readme}
                className="btn-primary w-full justify-center"
              >
                {translating ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    翻译中...
                  </>
                ) : (
                  <>
                    <Languages style={{ width: 16, height: 16 }} />
                    {readme ? "翻译 README" : "暂无 README"}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
