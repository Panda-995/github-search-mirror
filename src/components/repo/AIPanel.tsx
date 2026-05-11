"use client";

import { useState } from "react";
import { Sparkles, Loader2, Languages, RotateCcw, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIPanelProps {
  repoFullName: string;
  readme: string;
  description: string;
}

export function AIPanel({ repoFullName, readme, description }: AIPanelProps) {
  const [summary, setSummary] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "translate" | "qa">("summary");

  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");

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

  const askQuestion = async () => {
    const trimmedQ = question.trim();
    if (!trimmedQ || !readme) return;
    setQaLoading(true);
    setQaError("");
    try {
      const response = await fetch("/api/ai/readme-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readme, question: trimmedQ, repoFullName }),
      });
      const data = await response.json().catch(() => ({ error: "问答失败" }));
      if (!response.ok) throw new Error(data.error || "问答失败");
      setQaHistory((prev) => [...prev, { question: trimmedQ, answer: data.answer }]);
      setQuestion("");
    } catch (err) {
      setQaError(err instanceof Error ? err.message : "问答失败");
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-base)",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Sparkles style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
        <h3 className="text-xs font-semibold" style={{ color: "var(--color-text-heading)" }}>
          AI 助手
        </h3>
      </div>

      <div className="p-2">
        <div className="flex gap-1 mb-2">
          <TabBtn label="摘要" active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
            <Sparkles style={{ width: 12, height: 12, marginRight: 2 }} />
          </TabBtn>
          <TabBtn label="翻译" active={activeTab === "translate"} onClick={() => setActiveTab("translate")}>
            <Languages style={{ width: 12, height: 12, marginRight: 2 }} />
          </TabBtn>
          <TabBtn label="问答" active={activeTab === "qa"} onClick={() => setActiveTab("qa")}>
            <MessageCircle style={{ width: 12, height: 12, marginRight: 2 }} />
          </TabBtn>
        </div>

        {activeTab === "summary" && (
          <>
            {summary ? (
              <div className="max-h-48 overflow-y-auto text-xs leading-relaxed" style={{ color: "var(--color-text-body)" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{summary}</ReactMarkdown>
                <button
                  onClick={() => { setSummary(""); generateSummary(); }}
                  disabled={loading}
                  className="btn-ghost mt-1.5 text-xs"
                  style={{ padding: "2px 6px" }}
                >
                  {loading ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <RotateCcw style={{ width: 12, height: 12 }} />}
                  {" "}重新生成
                </button>
              </div>
            ) : (
              <button
                onClick={generateSummary}
                disabled={loading}
                className="btn-primary w-full justify-center text-xs"
                style={{ padding: "5px 12px" }}
              >
                {loading ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />生成中...</>
                  : <><Sparkles style={{ width: 13, height: 13 }} />生成 AI 摘要</>}
              </button>
            )}
          </>
        )}

        {activeTab === "translate" && (
          <>
            {translation ? (
              <div className="max-h-48 overflow-y-auto text-xs leading-relaxed" style={{ color: "var(--color-text-body)" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{translation}</ReactMarkdown>
                <button
                  onClick={() => { setTranslation(""); translateReadme(); }}
                  disabled={translating}
                  className="btn-ghost mt-1.5 text-xs"
                  style={{ padding: "2px 6px" }}
                >
                  {translating ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <RotateCcw style={{ width: 12, height: 12 }} />}
                  {" "}重新翻译
                </button>
              </div>
            ) : (
              <button
                onClick={translateReadme}
                disabled={translating || !readme}
                className="btn-primary w-full justify-center text-xs"
                style={{ padding: "5px 12px" }}
              >
                {translating ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />翻译中...</>
                  : <><Languages style={{ width: 13, height: 13 }} />{readme ? "翻译 README" : "暂无 README"}</>}
              </button>
            )}
          </>
        )}

        {activeTab === "qa" && (
          <>
            {qaHistory.length > 0 && (
              <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
                {qaHistory.map((item, index) => (
                  <div key={index}>
                    <div
                      className="p-1.5 rounded-md text-xs"
                      style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
                    >
                      <span style={{ fontWeight: 600 }}>Q: </span>{item.question}
                    </div>
                    <div
                      className="p-1.5 rounded-md text-xs leading-relaxed mt-0.5"
                      style={{ background: "var(--color-bg-page)", color: "var(--color-text-body)" }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{item.answer}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {qaError && <div className="text-xs mb-1.5" style={{ color: "var(--color-error)" }}>{qaError}</div>}
            <div className="flex gap-1.5">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={readme ? "输入问题..." : "该项目无 README"}
                disabled={!readme || qaLoading}
                className="input flex-1 text-xs"
                style={{ padding: "3px 6px" }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
              />
              <button
                onClick={askQuestion}
                disabled={!question.trim() || qaLoading || !readme}
                className="btn-primary text-xs"
                style={{ padding: "3px 8px" }}
              >
                {qaLoading ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <MessageCircle style={{ width: 13, height: 13 }} />}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>基于 README 回答</p>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center text-xs rounded-full border-none cursor-pointer whitespace-nowrap"
      style={{
        height: 28,
        padding: "0 12px",
        color: active ? "var(--color-primary)" : "var(--color-text-muted)",
        background: active ? "var(--color-primary-light)" : "var(--color-bg-hover)",
        fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
      }}
    >
      {children}
      {label}
    </button>
  );
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ fontSize: "12px", lineHeight: 1.6, marginBottom: 0 }}>{children}</p>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="readme-a" style={{ fontSize: "12px" }}>{children}</a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? <code className="readme-code-inline" style={{ fontSize: "11px" }}>{children}</code> : <pre className="readme-pre"><code className={className}>{children}</code></pre>;
  },
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="readme-ul" style={{ fontSize: "12px" }}>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="readme-ol" style={{ fontSize: "12px" }}>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="readme-li" style={{ fontSize: "12px" }}>{children}</li>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 style={{ fontSize: "13px", fontWeight: 600, margin: "4px 0" }}>{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 style={{ fontSize: "12px", fontWeight: 600, margin: "2px 0" }}>{children}</h3>,
};