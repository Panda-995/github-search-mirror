"use client";

import { useState } from "react";
import {
  User,
  Key,
  Bot,
  Globe,
  Cpu,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  TestTube,
  X,
  Clock,
} from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { updateUserSettings } from "@/server/settings.actions";

interface AIConfig {
  provider: string;
  model: string;
  apiEndpoint: string;
  apiKey: string;
  apiKeyConfigured?: boolean;
  clearApiKey?: boolean;
}

interface Settings {
  name: string;
  githubToken: string;
  githubTokenConfigured?: boolean;
  clearGithubToken?: boolean;
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

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; model?: string; provider?: string; latency?: string; error?: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      const result = await updateUserSettings(settings);
      setSettings((prev) => ({
        ...prev,
        githubToken: "",
        githubTokenConfigured: result.githubTokenConfigured,
        clearGithubToken: false,
        aiConfig: {
          ...prev.aiConfig,
          apiKey: "",
          apiKeyConfigured: result.aiApiKeyConfigured,
          clearApiKey: false,
        },
      }));
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

  const clearGitHubToken = () => {
    setSettings((prev) => ({
      ...prev,
      githubToken: "",
      githubTokenConfigured: false,
      clearGithubToken: true,
    }));
  };

  const clearAIKey = () => {
    setSettings((prev) => ({
      ...prev,
      aiConfig: {
        ...prev.aiConfig,
        apiKey: "",
        apiKeyConfigured: false,
        clearApiKey: true,
      },
    }));
  };

  const handleTestAI = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.aiConfig.provider,
          model: settings.aiConfig.model,
          apiKey: settings.aiConfig.apiKey || undefined,
          apiEndpoint: settings.aiConfig.apiEndpoint,
        }),
      });
      const data = await response.json().catch(() => ({ ok: false, error: "请求失败" }));
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "网络请求失败" });
    } finally {
      setTestLoading(false);
    }
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
              onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
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
                setSettings((prev) => ({
                  ...prev,
                  githubToken: e.target.value,
                  clearGithubToken: false,
                }))
              }
              placeholder={
                settings.githubTokenConfigured ? "已配置，留空保持不变" : "ghp_xxxxxxxxxxxxxxxxxxxx"
              }
              className="input w-full"
            />
            {settings.githubTokenConfigured && (
              <button type="button" onClick={clearGitHubToken} className="btn-danger mt-2 text-xs">
                <Trash2 style={{ width: 12, height: 12 }} />
                清除 Token
              </button>
            )}
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
              配置 GitHub Personal Access Token 可将 API 速率限制从每小时 60 次提升至 5000 次。
              {settings.githubTokenConfigured ? " 当前已配置，输入新 Token 可替换。" : ""}
              {settings.clearGithubToken ? " 保存后将删除当前 Token。" : ""}
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
                    type="button"
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
                      color: isSelected ? "var(--color-primary)" : "var(--color-text-body)",
                    }}
                  >
                    <span className="text-lg leading-none">{provider.icon}</span>
                    <span className="font-medium">{provider.name}</span>
                    <span
                      className="text-xs"
                      style={{
                        color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)",
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
              onChange={(e) => updateAIConfig({ apiKey: e.target.value, clearApiKey: false })}
              placeholder={
                settings.aiConfig.apiKeyConfigured ? "已配置，留空保持不变" : "输入你的 API Key"
              }
              className="input w-full"
            />
            {settings.aiConfig.apiKeyConfigured && (
              <button type="button" onClick={clearAIKey} className="btn-danger mt-2 text-xs">
                <Trash2 style={{ width: 12, height: 12 }} />
                清除 API Key
              </button>
            )}
            {settings.aiConfig.clearApiKey && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                保存后将删除当前 API Key。
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestAI}
              disabled={testLoading}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              {testLoading ? (
                <>
                  <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <TestTube style={{ width: 14, height: 14 }} />
                  测试连接
                </>
              )}
            </button>

            {testResult && (
              <div className="flex items-center gap-1.5">
                {testResult.ok ? (
                  <>
                    <Check style={{ width: 14, height: 14, color: "var(--color-success)" }} />
                    <span className="text-xs" style={{ color: "var(--color-success)" }}>
                      连接成功
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <Clock style={{ width: 10, height: 10, display: "inline", marginRight: 2 }} />
                      {testResult.latency}
                    </span>
                  </>
                ) : (
                  <>
                    <X style={{ width: 14, height: 14, color: "var(--color-error)" }} />
                    <span className="text-xs" style={{ color: "var(--color-error)" }}>
                      {testResult.error || "连接失败"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button & Status */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
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
