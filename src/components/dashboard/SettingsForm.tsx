"use client";

import { useState } from "react";
import { User, Key, Bot, Globe, Cpu, Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { updateUserSettings } from "@/server/settings.actions";

interface AIConfig {
  provider: string;
  model: string;
  apiEndpoint: string;
  apiKey: string;
}

interface Settings {
  name: string;
  githubToken: string;
  aiConfig: AIConfig;
}

interface SettingsFormProps {
  initialSettings: Settings;
}

const PROVIDERS = [
  { id: "claude", name: "Claude", description: "Anthropic", icon: "🅲" },
  { id: "openai", name: "OpenAI", description: "GPT-4 / GPT-3.5", icon: "🅾" },
  { id: "gemini", name: "Gemini", description: "Google", icon: "🅶" },
  { id: "deepseek", name: "DeepSeek", description: "深度求索", icon: "🅳" },
  { id: "custom", name: "自定义", description: "兼容 OpenAI 格式", icon: "⚙" },
];

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      await updateUserSettings(settings);
      setSaveStatus("success");
      setSaveMessage("设置已保存");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateAIConfig = (updates: Partial<AIConfig>) => {
    setSettings((prev) => ({
      ...prev,
      aiConfig: { ...prev.aiConfig, ...updates },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Personal Info */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <User style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
          <h2
            className="text-sm"
            style={{
              color: "var(--color-text-heading)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            个人信息
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              用户名
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="输入你的用户名"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* GitHub Token */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <Globe style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
          <h2
            className="text-sm"
            style={{
              color: "var(--color-text-heading)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            GitHub 配置
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              <Key style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
              GitHub Token
            </label>
            <input
              type="password"
              value={settings.githubToken}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, githubToken: e.target.value }))
              }
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="input w-full"
            />
            <p
              className="mt-1.5 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              配置 GitHub Personal Access Token 可将 API 速率限制从每小时 60 次提升至 5000 次。
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1"
                style={{ color: "var(--color-primary)" }}
              >
                去获取 →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* AI Config */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <Bot style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
          <h2
            className="text-sm"
            style={{
              color: "var(--color-text-heading)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            AI 配置
          </h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Provider Selection */}
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              默认 AI 提供商
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROVIDERS.map((provider) => {
                const isSelected = settings.aiConfig.provider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => updateAIConfig({ provider: provider.id })}
                    className="relative flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg text-sm transition-all"
                    style={{
                      background: isSelected
                        ? "var(--color-primary-light)"
                        : "var(--color-bg-page)",
                      border: isSelected
                        ? "2px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                      color: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-text-body)",
                    }}
                  >
                    <span className="text-lg leading-none">{provider.icon}</span>
                    <span className="font-medium">{provider.name}</span>
                    <span
                      className="text-xs"
                      style={{
                        color: isSelected
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {provider.description}
                    </span>
                    {isSelected && (
                      <Check
                        style={{
                          width: 14,
                          height: 14,
                          position: "absolute",
                          top: 4,
                          right: 4,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model */}
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              <Cpu style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
              模型
            </label>
            <input
              type="text"
              value={settings.aiConfig.model}
              onChange={(e) => updateAIConfig({ model: e.target.value })}
              placeholder="例如: gpt-4, claude-3-opus, gemini-pro"
              className="input w-full"
            />
          </div>

          {/* API Endpoint */}
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              <Globe style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
              API 端点
            </label>
            <input
              type="url"
              value={settings.aiConfig.apiEndpoint}
              onChange={(e) => updateAIConfig({ apiEndpoint: e.target.value })}
              placeholder="https://api.openai.com/v1 或自定义端点"
              className="input w-full"
            />
          </div>

          {/* API Key */}
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--color-text-body)" }}
            >
              <Key style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
              API Key
            </label>
            <input
              type="password"
              value={settings.aiConfig.apiKey}
              onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
              placeholder="输入你的 API Key"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Save Button & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
          ) : (
            <Save style={{ width: 14, height: 14 }} />
          )}
          保存设置
        </button>

        {saveStatus === "success" && (
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--color-success)" }}
          >
            <Check style={{ width: 14, height: 14 }} />
            {saveMessage}
          </div>
        )}

        {saveStatus === "error" && (
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--color-error)" }}
          >
            <AlertCircle style={{ width: 14, height: 14 }} />
            {saveMessage}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <Key style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
          <h2
            className="text-sm"
            style={{
              color: "var(--color-text-heading)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            安全
          </h2>
        </div>
        <div className="p-5">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
