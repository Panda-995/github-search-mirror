"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Play, Save, Trash2 } from "lucide-react";

interface SearchPreset {
  id: string;
  name: string;
  queryString: string;
  createdAt: string;
}

const STORAGE_KEY = "gitmirror:search-presets";

function readPresets() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? (parsed as SearchPreset[]) : [];
  } catch {
    return [];
  }
}

function writePresets(presets: SearchPreset[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, 20)));
}

function withoutPageParam(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  return params.toString();
}

function getReadableQuery(queryString: string) {
  try {
    return decodeURIComponent(queryString).replaceAll("&", " · ");
  } catch {
    return queryString;
  }
}

interface SearchPresetPanelProps {
  onNavigate?: () => void;
}

export function SearchPresetPanel({ onNavigate }: SearchPresetPanelProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<SearchPreset[]>(() =>
    typeof window === "undefined" ? [] : readPresets()
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const currentQueryString = useMemo(
    () => withoutPageParam(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const savePreset = () => {
    if (!currentQueryString) {
      setMessage("当前没有可保存的搜索条件");
      return;
    }
    const safeName = name.trim().slice(0, 40);
    if (!safeName) {
      setMessage("先给预设起个名字");
      return;
    }

    const next = [
      {
        id: crypto.randomUUID(),
        name: safeName,
        queryString: currentQueryString,
        createdAt: new Date().toISOString(),
      },
      ...presets.filter((item) => item.name !== safeName),
    ].slice(0, 20);

    setPresets(next);
    writePresets(next);
    setName("");
    setMessage("已保存");
  };

  const removePreset = (id: string) => {
    const next = presets.filter((item) => item.id !== id);
    setPresets(next);
    writePresets(next);
  };

  const applyPreset = (preset: SearchPreset) => {
    router.push(`/search?${preset.queryString}`);
    onNavigate?.();
  };

  return (
    <div
      className="p-4"
      style={{
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-base)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Bookmark style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
            搜索预设
          </h2>
        </div>
        {presets.length > 0 && (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {presets.length}/20
          </span>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          savePreset();
        }}
      >
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setMessage("");
          }}
          placeholder="例如：前端 UI 库"
          className="input min-w-0 flex-1 text-xs"
          style={{ height: 34, padding: "6px 10px" }}
        />
        <button type="submit" className="btn-primary text-xs" style={{ padding: "7px 10px" }}>
          <Save style={{ width: 13, height: 13 }} />
          保存
        </button>
      </form>

      {message && (
        <p
          className="mt-2 text-xs"
          style={{ color: message === "已保存" ? "var(--color-success)" : "var(--color-error)" }}
        >
          {message}
        </p>
      )}

      {presets.length === 0 ? (
        <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          保存当前关键词和筛选条件后，下次可以一键恢复。
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-lg px-2 py-2"
              style={{ background: "var(--color-bg-page)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                  style={{ color: "var(--color-text-heading)" }}
                  title={preset.queryString}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-label={`应用 ${preset.name}`}
                  className="icon-btn"
                  style={{ width: 28, height: 28 }}
                >
                  <Play style={{ width: 13, height: 13 }} />
                </button>
                <button
                  type="button"
                  onClick={() => removePreset(preset.id)}
                  aria-label={`删除 ${preset.name}`}
                  className="icon-btn"
                  style={{ width: 28, height: 28, color: "var(--color-error)" }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <p className="mt-1 truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                {getReadableQuery(preset.queryString)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
