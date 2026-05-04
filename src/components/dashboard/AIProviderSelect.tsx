"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const PROVIDERS = [
  { id: "claude", name: "Claude (Anthropic)", description: "系统默认" },
  { id: "openai", name: "OpenAI GPT", description: "GPT-4 / GPT-3.5" },
  { id: "gemini", name: "Google Gemini", description: "Gemini Pro" },
  { id: "custom", name: "自定义", description: "使用自己的 API 端点" },
];

export function AIProviderSelect() {
  const [selected, setSelected] = useState("claude");
  const [isOpen, setIsOpen] = useState(false);

  const current = PROVIDERS.find((p) => p.id === selected) ?? PROVIDERS[0];

  return (
    <div>
      <label className="text-xs font-medium block mb-2" style={{ color: "var(--surface-500)" }}>
        默认 AI 提供商
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-sm px-3 py-2.5 rounded-md transition-colors"
          style={{
            background: "rgba(250, 250, 250, 0.7)",
            border: "1px solid var(--border-default)",
            color: "var(--surface-900)",
          }}
        >
          <div>
            <span className="font-medium">{current.name}</span>
            <span className="ml-2 text-xs" style={{ color: "var(--surface-400)" }}>
              {current.description}
            </span>
          </div>
          <ChevronDown
            style={{
              width: 16,
              height: 16,
              color: "var(--surface-400)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="absolute left-0 right-0 top-full mt-1 z-20 overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelected(provider.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors"
                  style={{
                    background: selected === provider.id ? "var(--accent-indigo-light)" : "transparent",
                    color: selected === provider.id ? "var(--accent-indigo)" : "var(--surface-700)",
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== provider.id) {
                      e.currentTarget.style.background = "var(--surface-50)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== provider.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div>
                    <span className="font-medium">{provider.name}</span>
                    <span
                      className="ml-2 text-xs"
                      style={{ color: selected === provider.id ? "var(--accent-indigo)" : "var(--surface-400)" }}
                    >
                      {provider.description}
                    </span>
                  </div>
                  {selected === provider.id && (
                    <Check style={{ width: 16, height: 16 }} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
