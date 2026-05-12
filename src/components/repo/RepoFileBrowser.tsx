"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronLeft,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  Folder,
  Loader2,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RepoFileBrowserProps {
  owner: string;
  repoName: string;
}

interface TreeItem {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size: number;
  html_url: string;
  download_url: string | null;
}

interface FilePayload {
  file: {
    name: string;
    path: string;
    size: number;
    html_url: string;
    download_url: string | null;
    content: string;
  };
}

const MAX_AI_CODE_CHARS = 60_000;

function getLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TSX",
    js: "JavaScript",
    jsx: "JSX",
    py: "Python",
    rs: "Rust",
    go: "Go",
    java: "Java",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    json: "JSON",
    md: "Markdown",
    yml: "YAML",
    yaml: "YAML",
    sql: "SQL",
    sh: "Shell",
  };
  return ext ? map[ext] || ext.toUpperCase() : "Text";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function RepoFileBrowser({ owner, repoName }: RepoFileBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<TreeItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FilePayload["file"] | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [fileError, setFileError] = useState("");
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explainError, setExplainError] = useState("");
  const [explaining, setExplaining] = useState(false);

  const repoPath = `${owner}/${repoName}`;

  const loadTree = useCallback(
    async (path: string) => {
      setLoadingTree(true);
      setTreeError("");
      try {
        const response = await fetch(
          `/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents?path=${encodeURIComponent(path)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "目录加载失败");
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        setTreeError(error instanceof Error ? error.message : "目录加载失败");
      } finally {
        setLoadingTree(false);
      }
    },
    [owner, repoName]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => loadTree(currentPath), 0);
    return () => window.clearTimeout(timer);
  }, [currentPath, loadTree]);

  const openFile = async (item: TreeItem) => {
    setLoadingFile(true);
    setFileError("");
    setExplanation("");
    setExplainError("");
    try {
      const response = await fetch(
        `/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/file?path=${encodeURIComponent(item.path)}`
      );
      const data = (await response.json().catch(() => ({}))) as Partial<FilePayload> & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "文件加载失败");
      if (!data.file) throw new Error("文件响应为空");
      setSelectedFile(data.file);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "文件加载失败");
    } finally {
      setLoadingFile(false);
    }
  };

  const goUp = () => {
    if (!currentPath) return;
    setCurrentPath(currentPath.split("/").slice(0, -1).join("/"));
  };

  const copyFile = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const explainCode = async () => {
    if (!selectedFile) return;
    setExplaining(true);
    setExplainError("");
    try {
      const response = await fetch("/api/ai/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selectedFile.content.slice(0, MAX_AI_CODE_CHARS),
          language: getLanguage(selectedFile.path),
        }),
      });
      const data = await response.json().catch(() => ({ error: "代码解释失败" }));
      if (!response.ok) throw new Error(data.error || "代码解释失败");
      setExplanation(data.explanation || "暂无解释");
    } catch (error) {
      setExplainError(error instanceof Error ? error.message : "代码解释失败");
    } finally {
      setExplaining(false);
    }
  };

  const lines = useMemo(() => selectedFile?.content.split(/\r?\n/) ?? [], [selectedFile]);

  return (
    <div className="card overflow-hidden">
      <div
        className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <Code2 style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
              源码浏览
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {currentPath || repoPath}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goUp} disabled={!currentPath} className="btn-secondary text-xs">
            <ChevronLeft style={{ width: 14, height: 14 }} />
            上级
          </button>
          <button type="button" onClick={() => loadTree(currentPath)} className="btn-ghost text-xs">
            <RotateCcw style={{ width: 14, height: 14 }} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div
          className="min-h-72 lg:max-h-[640px] lg:overflow-y-auto"
          style={{ borderRight: "1px solid var(--color-border)" }}
        >
          {loadingTree ? (
            <div className="flex items-center gap-2 p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
              加载目录...
            </div>
          ) : treeError ? (
            <div className="p-4 text-sm" style={{ color: "var(--color-error)" }}>
              {treeError}
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              当前目录为空
            </div>
          ) : (
            <div className="p-2">
              {items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    if (item.type === "dir") {
                      setCurrentPath(item.path);
                    } else if (item.type === "file") {
                      openFile(item);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors"
                  style={{
                    color:
                      selectedFile?.path === item.path
                        ? "var(--color-primary)"
                        : "var(--color-text-body)",
                    background:
                      selectedFile?.path === item.path
                        ? "var(--color-primary-alpha-8)"
                        : "transparent",
                  }}
                >
                  {item.type === "dir" ? (
                    <Folder style={{ width: 15, height: 15, color: "var(--color-trending)" }} />
                  ) : (
                    <FileCode2 style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                  {item.type === "file" && (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatBytes(item.size)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          {loadingFile ? (
            <div className="flex min-h-72 items-center justify-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
              加载文件...
            </div>
          ) : fileError ? (
            <div className="p-5 text-sm" style={{ color: "var(--color-error)" }}>
              {fileError}
            </div>
          ) : selectedFile ? (
            <>
              <div
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div className="min-w-0">
                  <h3
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    {selectedFile.path}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {getLanguage(selectedFile.path)} · {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={copyFile} className="btn-secondary text-xs">
                    <Copy style={{ width: 14, height: 14 }} />
                    {copied ? "已复制" : "复制"}
                  </button>
                  <button type="button" onClick={explainCode} disabled={explaining} className="btn-primary text-xs">
                    {explaining ? (
                      <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                    ) : (
                      <Bot style={{ width: 14, height: 14 }} />
                    )}
                    AI 解释
                  </button>
                  <a
                    href={selectedFile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost text-xs"
                  >
                    <ExternalLink style={{ width: 14, height: 14 }} />
                    GitHub
                  </a>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto" style={{ background: "#0f172a" }}>
                <pre
                  className="m-0 p-0"
                  style={{
                    color: "#e2e8f0",
                    fontFamily: "var(--font-family-code)",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-[56px_minmax(0,1fr)]">
                      <span
                        className="select-none px-3 text-right"
                        style={{ color: "#64748b", borderRight: "1px solid rgba(148,163,184,0.2)" }}
                      >
                        {index + 1}
                      </span>
                      <code className="whitespace-pre px-3">{line || " "}</code>
                    </div>
                  ))}
                </pre>
              </div>

              {(explanation || explainError) && (
                <div className="px-5 py-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <Bot style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
                      AI 代码解释
                    </h3>
                  </div>
                  {explainError ? (
                    <p className="text-sm" style={{ color: "var(--color-error)" }}>
                      {explainError}
                    </p>
                  ) : (
                    <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-body)" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <FileCode2
                style={{ width: 32, height: 32, color: "var(--color-text-muted)" }}
                className="mb-3"
              />
              <p className="text-sm font-medium" style={{ color: "var(--color-text-heading)" }}>
                选择一个文件开始预览
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                支持查看文本文件，并可直接调用 AI 解释代码。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
