"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ExternalLink,
  GitCompareArrows,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { COMPARE_STORAGE_KEY, MAX_COMPARE_REPOS } from "./CompareButton";
import { formatDate, formatNumber } from "@/lib/utils";

interface CompareRepo {
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  language: string | null;
  languages: Record<string, number>;
  license: string | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  html_url: string;
  health: {
    score: number;
    grade: string;
    label: string;
    risks: { title: string; level: string }[];
    suggestions: string[];
  };
}

interface CompareResponse {
  repos: CompareRepo[];
  errors: { repo: string; message: string }[];
}

const REPO_FULL_NAME_RE = /^[\w.-]+\/[\w.-]+$/;

function readRepos() {
  try {
    const value = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeRepos(repos: string[]) {
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(repos.slice(0, MAX_COMPARE_REPOS)));
  window.dispatchEvent(new CustomEvent("gitmirror:compare-change"));
}

function dominantLanguages(repo: CompareRepo) {
  const entries = Object.entries(repo.languages || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return repo.language || "未知";
  return entries.slice(0, 3).map(([name]) => name).join(", ");
}

export function CompareBoard() {
  const [repoNames, setRepoNames] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRepos()
  );
  const [data, setData] = useState<CompareResponse>({ repos: [], errors: [] });
  const [manualRepo, setManualRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const query = useMemo(() => repoNames.join(","), [repoNames]);

  const syncRepos = useCallback(() => {
    setRepoNames(readRepos());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncRepos);
    window.addEventListener("gitmirror:compare-change", syncRepos);
    return () => {
      window.removeEventListener("storage", syncRepos);
      window.removeEventListener("gitmirror:compare-change", syncRepos);
    };
  }, [syncRepos]);

  useEffect(() => {
    if (!query) {
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/compare?repos=${encodeURIComponent(query)}`)
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || "对比数据加载失败");
          return body as CompareResponse;
        })
        .then((body) => {
          if (!ignore) setData(body);
        })
        .catch((error) => {
          if (!ignore) {
            setData({ repos: [], errors: [{ repo: "compare", message: error.message }] });
          }
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const addManualRepo = () => {
    const repo = manualRepo.trim();
    if (!REPO_FULL_NAME_RE.test(repo)) {
      setMessage("请输入 owner/repo 格式的仓库名");
      return;
    }
    const next = [repo, ...repoNames.filter((item) => item !== repo)].slice(0, MAX_COMPARE_REPOS);
    writeRepos(next);
    setManualRepo("");
    setMessage("");
  };

  const removeRepo = (repo: string) => {
    writeRepos(repoNames.filter((item) => item !== repo));
  };

  const clearRepos = () => {
    writeRepos([]);
    setMessage("");
  };

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
              对比列表
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              最多同时比较 {MAX_COMPARE_REPOS} 个仓库，列表保存在当前浏览器。
            </p>
          </div>
          {repoNames.length > 0 && (
            <button type="button" onClick={clearRepos} className="btn-secondary text-xs">
              <Trash2 style={{ width: 14, height: 14 }} />
              清空
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualRepo}
            onChange={(event) => setManualRepo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addManualRepo();
              }
            }}
            placeholder="vercel/next.js"
            className="input flex-1"
          />
          <button type="button" onClick={addManualRepo} className="btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            添加
          </button>
        </div>

        {message && (
          <p className="mt-2 text-xs" style={{ color: "var(--color-error)" }}>
            {message}
          </p>
        )}

        {repoNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {repoNames.map((repo) => (
              <span key={repo} className="tag" style={{ height: 30 }}>
                {repo}
                <button
                  type="button"
                  onClick={() => removeRepo(repo)}
                  aria-label={`移除 ${repo}`}
                  className="icon-btn"
                  style={{ width: 18, height: 18, marginLeft: 4 }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {repoNames.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-4 py-16 text-center">
          <GitCompareArrows
            style={{ width: 36, height: 36, color: "var(--color-text-muted)" }}
            className="mb-3"
          />
          <p className="text-base font-semibold" style={{ color: "var(--color-text-heading)" }}>
            还没有加入对比的仓库
          </p>
          <p className="text-sm mt-1 mb-5" style={{ color: "var(--color-text-muted)" }}>
            在搜索结果或仓库详情页点击“对比”，也可以在上方手动输入。
          </p>
          <Link href="/search" className="btn-primary">
            去搜索
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            {loading ? (
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            ) : (
              <GitCompareArrows style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
            )}
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
              横向对比
            </h2>
          </div>

          {data.errors.length > 0 && (
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              {data.errors.map((error) => (
                <p
                  key={`${error.repo}-${error.message}`}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "var(--color-error)" }}
                >
                  <AlertCircle style={{ width: 13, height: 13 }} />
                  {error.repo}: {error.message}
                </p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 760 }}>
              <thead>
                <tr style={{ background: "var(--color-bg-page)" }}>
                  <th className="px-4 py-3 text-left" style={{ color: "var(--color-text-muted)" }}>
                    维度
                  </th>
                  {data.repos.map((repo) => (
                    <th
                      key={repo.full_name}
                      className="px-4 py-3 text-left align-top"
                      style={{ color: "var(--color-text-heading)" }}
                    >
                      <Link
                        href={`/repo/${repo.full_name}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {repo.full_name}
                      </Link>
                      <p
                        className="mt-1 line-clamp-2 text-xs font-normal"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {repo.description || "暂无描述"}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="健康评分" values={data.repos.map((repo) => `${repo.health.score} · ${repo.health.grade}`)} />
                <CompareRow label="Stars" values={data.repos.map((repo) => formatNumber(repo.stars))} />
                <CompareRow label="Forks" values={data.repos.map((repo) => formatNumber(repo.forks))} />
                <CompareRow label="Open Issues" values={data.repos.map((repo) => formatNumber(repo.open_issues))} />
                <CompareRow label="主要语言" values={data.repos.map(dominantLanguages)} />
                <CompareRow label="License" values={data.repos.map((repo) => repo.license || "未知")} />
                <CompareRow label="最近更新" values={data.repos.map((repo) => formatDate(repo.pushed_at))} />
                <CompareRow
                  label="主要风险"
                  values={data.repos.map((repo) =>
                    repo.health.risks.length > 0
                      ? repo.health.risks.map((risk) => risk.title).join("、")
                      : "暂无明显风险"
                  )}
                />
                <CompareRow
                  label="建议"
                  values={data.repos.map((repo) => repo.health.suggestions[0] || "适合进一步评估")}
                />
                <tr style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>
                    操作
                  </td>
                  {data.repos.map((repo) => (
                    <td key={repo.full_name} className="px-4 py-3">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost text-xs"
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} />
                        GitHub
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr style={{ borderTop: "1px solid var(--color-border)" }}>
      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="px-4 py-3 align-top"
          style={{ color: "var(--color-text-body)" }}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
