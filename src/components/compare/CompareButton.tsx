"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows, Check } from "lucide-react";

const STORAGE_KEY = "gitmirror:compare";
const MAX_REPOS = 5;

function readCompareRepos() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeCompareRepos(repos: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(repos.slice(0, MAX_REPOS)));
  window.dispatchEvent(new CustomEvent("gitmirror:compare-change"));
}

export function CompareButton({
  repoFullName,
  compact = false,
}: {
  repoFullName: string;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const sync = () => {
      const repos = readCompareRepos();
      setSelected(repos.includes(repoFullName));
      setFull(repos.length >= MAX_REPOS && !repos.includes(repoFullName));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("gitmirror:compare-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gitmirror:compare-change", sync);
    };
  }, [repoFullName]);

  const toggle = () => {
    const repos = readCompareRepos();
    const next = repos.includes(repoFullName)
      ? repos.filter((item) => item !== repoFullName)
      : [repoFullName, ...repos].slice(0, MAX_REPOS);
    writeCompareRepos(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={full}
      aria-pressed={selected}
      title={full ? "最多对比 5 个仓库" : selected ? "从对比中移除" : "加入仓库对比"}
      className={compact ? "btn-ghost text-xs" : "btn-secondary"}
      style={{
        padding: compact ? "6px 8px" : undefined,
        opacity: full ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {selected ? (
        <Check style={{ width: compact ? 13 : 16, height: compact ? 13 : 16 }} />
      ) : (
        <GitCompareArrows style={{ width: compact ? 13 : 16, height: compact ? 13 : 16 }} />
      )}
      <span className={compact ? "hidden sm:inline" : undefined}>{selected ? "已加入" : "对比"}</span>
    </button>
  );
}

export { STORAGE_KEY as COMPARE_STORAGE_KEY, MAX_REPOS as MAX_COMPARE_REPOS };
