"use client";

import Link from "next/link";
import { Star, GitFork, Circle, Clock, Heart, AlertTriangle } from "lucide-react";
import type { RepoItem } from "@/types";
import { formatNumber, formatDate } from "@/lib/utils";
import { calculateRepoHealth, getTopRisk } from "@/lib/repo-insights";
import { useMemo } from "react";
import { CompareButton } from "@/components/compare/CompareButton";

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

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#ECFDF5", text: "#059669" },
  B: { bg: "#F0F9FF", text: "#0284C7" },
  C: { bg: "#FFFBEB", text: "#D97706" },
  D: { bg: "#FEF2F2", text: "#DC2626" },
  F: { bg: "#FEF2F2", text: "#991B1B" },
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#D97706",
  medium: "#0284C7",
  low: "#6B7280",
};

export function RepoCard({ repo }: RepoCardProps) {
  const health = useMemo(() => {
    try {
      return calculateRepoHealth({
        stargazers_count: repo.stars,
        forks_count: repo.forks,
        open_issues_count: repo.open_issues,
        watchers_count: repo.watchers,
        language: repo.language,
        description: repo.description,
        license: repo.license ? { name: repo.license } : null,
        created_at: repo.created_at,
        pushed_at: repo.pushed_at,
        updated_at: repo.updated_at,
        homepage: repo.homepage,
        topics: repo.topics,
        has_readme: true,
      });
    } catch {
      return null;
    }
  }, [repo]);

  const topRisk = health ? getTopRisk(health.risks) : null;
  const gradeColors = health ? (GRADE_COLORS[health.grade] || GRADE_COLORS.C) : null;

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
          {repo.owner}/
          <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{repo.name}</span>
        </Link>
        <CompareButton repoFullName={repo.full_name} compact />
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
            <span key={topic} className="tag">
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
          <GitFork style={{ width: 13, height: 13 }} />
          <span style={{ fontWeight: "var(--font-weight-medium)" }}>
            {formatNumber(repo.forks)}
          </span>
        </span>

        {/* Health Score Badge */}
        {health && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: gradeColors?.bg,
              color: gradeColors?.text,
            }}
          >
            <Heart style={{ width: 11, height: 11 }} />
            {health.score} · {health.grade}
          </span>
        )}

        {/* Top Risk Badge */}
        {topRisk && (
          <span
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: RISK_LEVEL_COLORS[topRisk.level] || "#6B7280" }}
          >
            <AlertTriangle style={{ width: 11, height: 11 }} />
            {topRisk.title}
          </span>
        )}

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
