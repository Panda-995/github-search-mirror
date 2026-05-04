"use client";

import { useState } from "react";
import { Sparkles, Loader2, MessageSquare, Languages, Lightbulb, Send } from "lucide-react";

interface AIPanelProps {
  repoFullName: string;
  readme: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIPanel({ repoFullName, readme }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<"explain" | "translate" | "chat">("explain");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleAction = async (action: string) => {
    setLoading(true);
    setResult("");

    try {
      const endpoint = action === "translate" ? "/api/ai/translate" : "/api/ai/explain";
      const body =
        action === "translate"
          ? { text: readme || "", targetLang: "zh" }
          : { repoName: repoFullName, description: "", readme: readme || "" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResult(data.translation || data.explanation || data.summary || "暂无结果");
    } catch {
      setResult("AI 服务暂时不可用");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    const question = chatInput.trim();
    if (!question || loading) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: question }];
    setChatMessages(newMessages);
    setChatInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repoFullName,
          description: "",
          readme: readme || "",
          question,
        }),
      });

      const data = await res.json();
      const answer = data.explanation || data.summary || "抱歉，我无法回答这个问题。";
      setChatMessages([...newMessages, { role: "assistant", content: answer }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "AI 服务暂时不可用" }]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "explain" as const, label: "项目解读", icon: Lightbulb },
    { id: "translate" as const, label: "翻译", icon: Languages },
    { id: "chat" as const, label: "问答", icon: MessageSquare },
  ];

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
        <Sparkles style={{ width: 16, height: 16, color: "var(--accent-indigo)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--surface-700)" }}>
          AI 助手
        </span>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult("");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? "var(--accent-indigo)" : "var(--surface-500)",
              background: activeTab === tab.id ? "var(--accent-indigo-light)" : "transparent",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-indigo)" : "2px solid transparent",
            }}
          >
            <tab.icon style={{ width: 13, height: 13 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "explain" && (
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--surface-500)" }}>
              获取该项目的 AI 深度解读
            </p>
            <button
              onClick={() => handleAction("explain")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                background: "var(--accent-indigo)",
                color: "white",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {loading ? "分析中..." : "解读项目"}
            </button>
          </div>
        )}

        {activeTab === "translate" && (
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--surface-500)" }}>
              将 README 翻译为中文
            </p>
            <button
              onClick={() => handleAction("translate")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                background: "var(--accent-indigo)",
                color: "white",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
              {loading ? "翻译中..." : "翻译 README"}
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--surface-500)" }}>
              向 AI 询问关于该项目的问题
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="输入问题..."
                className="flex-1 text-sm px-3 py-2 rounded-md outline-none"
                style={{
                  background: "rgba(250, 250, 250, 0.7)",
                  border: "1px solid var(--border-default)",
                  color: "var(--surface-900)",
                }}
              />
              <button
                onClick={handleChatSubmit}
                disabled={loading || !chatInput.trim()}
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                style={{
                  background: chatInput.trim() ? "var(--accent-indigo)" : "var(--surface-200)",
                  color: chatInput.trim() ? "white" : "var(--surface-400)",
                  cursor: chatInput.trim() ? "pointer" : "not-allowed",
                }}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Result for explain/translate */}
        {result && activeTab !== "chat" && (
          <div
            className="mt-3 p-3 rounded-md text-sm leading-relaxed"
            style={{
              background: "rgba(250, 250, 250, 0.7)",
              border: "1px solid var(--border-subtle)",
              color: "var(--surface-700)",
            }}
          >
            {result}
          </div>
        )}

        {/* Chat messages */}
        {activeTab === "chat" && chatMessages.length > 0 && (
          <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className="p-3 rounded-md text-sm leading-relaxed"
                style={{
                  background: msg.role === "user" ? "var(--accent-indigo-light)" : "rgba(250, 250, 250, 0.7)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--surface-700)",
                }}
              >
                <span className="text-xs font-medium block mb-1" style={{ color: msg.role === "user" ? "var(--accent-indigo)" : "var(--surface-500)" }}>
                  {msg.role === "user" ? "你" : "AI"}
                </span>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 p-3" style={{ color: "var(--surface-400)" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">思考中...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
