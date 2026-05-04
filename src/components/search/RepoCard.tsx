"use client";

import Link from "next/link";
import { Star, GitFork, Circle, Clock } from "lucide-react";
import type { RepoItem } from "@/types";

interface RepoCardProps {
  repo: RepoItem;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Julia: "#a270ba",
  Scala: "#c22d40",
};

export function RepoCard({ repo }: RepoCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 周前`;
    if (days < 365) return `${Math.floor(days / 30)} 个月前`;
    return `${Math.floor(days / 365)} 年前`;
  };

  return (
    <div className="list-item-card group" style={{ padding: "24px" }}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link
          href={`/repo/${repo.owner}/${repo.name}`}
          className="line-clamp-1 transition-colors hover:underline"
          style={{
            fontSize: "18px",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-primary)",
          }}
        >
          {repo.owner}/<span style={{ fontWeight: "var(--font-weight-semibold)" }}>{repo.name}</span>
        </Link>
      </div>

      {/* Description */}
      {repo.description && (
        <p
          className="mb-3 line-clamp-2"
          style={{
            fontSize: "var(--font-size-body)",
            lineHeight: "var(--line-height-body)",
            color: "var(--color-text-body)",
          }}
        >
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {repo.topics.slice(0, 5).map((topic: string) => (
            <span
              key={topic}
              className="tag"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-6 flex-wrap">
        {repo.language && (
          <span
            className="flex items-center gap-1.5"
            style={{
              fontSize: "var(--font-size-caption)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-text-muted)",
            }}
          >
            <Circle
              className="flex-shrink-0"
              style={{
                width: 10,
                height: 10,
                fill: LANGUAGE_COLORS[repo.language] || "var(--color-text-muted)",
                color: LANGUAGE_COLORS[repo.language] || "var(--color-text-muted)",
              }}
            />
            {repo.language}
          </span>
        )}

        <span
          className="flex items-center gap-1"
          style={{
            fontSize: "var(--font-size-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          <Star style={{ width: 13, height: 13 }} />
          <span style={{ fontWeight: "var(--font-weight-medium)" }}>
            {formatNumber(repo.stars)}
          </span>
        </span>

        <span
          className="flex items-center gap-1"
          style={{
            fontSize: "var(--font-size-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          <GitFork
            style={{ width: 13, height: 13 }}
          />
          <span style={{ fontWeight: "var(--font-weight-medium)" }}>
            {formatNumber(repo.forks)}
          </span>
        </span>

        <span
          className="flex items-center gap-1 ml-auto"
          style={{
            fontSize: "var(--font-size-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          <Clock style={{ width: 12, height: 12 }} />
          {formatDate(repo.pushed_at)}
        </span>
      </div>
    </div>
  );
}
