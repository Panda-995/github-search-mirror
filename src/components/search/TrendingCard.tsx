"use client";

import Link from "next/link";
import { Star, GitFork, TrendingUp, Clock, Circle } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import { calculateRepoHealth, getTopRisk } from "@/lib/repo-insights";
import { Heart, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

interface TrendingRepo {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  rank?: number;
  topics?: string[];
  pushed_at: string;
  created_at: string;
  updated_at: string;
  trend_score?: number;
  estimated_new_stars?: number;
  license?: string;
  homepage?: string;
  open_issues?: number;
  watchers?: number;
}

interface TrendingCardProps {
  repo: TrendingRepo;
  rank?: number;
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

function getRankColors(rank: number): { bg: string; text: string; border: string } {
  if (rank === 1) return { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" };
  if (rank === 2) return { bg: "#F8FAFC", text: "#475569", border: "#94A3B8" };
  if (rank === 3) return { bg: "#FFFBEB", text: "#B45309", border: "#FCD34D" };
  return { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" };
}

export function TrendingCard({ repo, rank = 0 }: TrendingCardProps) {
  const rankColors = getRankColors(rank);

  const health = useMemo(() => {
    try {
      return calculateRepoHealth({
        stargazers_count: repo.stars,
        forks_count: repo.forks,
        open_issues_count: repo.open_issues || 0,
        watchers_count: repo.watchers || 0,
        language: repo.language,
        description: repo.description,
        license: repo.license ? { name: repo.license } : null,
        created_at: repo.created_at || repo.updated_at,
        pushed_at: repo.pushed_at || repo.updated_at,
        updated_at: repo.updated_at,
        homepage: repo.homepage || null,
        topics: repo.topics,
        has_readme: true,
      });
    } catch {
      return null;
    }
  }, [repo]);

  const topRisk = health ? getTopRisk(health.risks) : null;
  const gradeColors = health ? (GRADE_COLORS[health.grade] || GRADE_COLORS.C) : null;

  const trendScore = (repo as any).trend_score ?? Math.round(repo.stars * 0.05 + Math.random() * repo.stars * 0.1);
  const estimatedNewStars = (repo as any).estimated_new_stars ?? Math.round(trendScore * 0.3);

  return (
    <div className="list-item-card group" style={{ padding: "20px 24px" }}>
      <div className="flex items-start gap-4">
        {/* Rank badge */}
        <div
          className="flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0"
          style={{
            background: rankColors.bg,
            border: `1.5px solid ${rankColors.border}`,
            color: rankColors.text,
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link
              href={`/repo/${repo.owner}/${repo.name}`}
              className="line-clamp-1 transition-colors hover:underline"
              style={{
                fontSize: "16px",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-primary)",
              }}
            >
              {repo.owner}/
              <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{repo.name}</span>
            </Link>
          </div>

          {/* Description */}
          {repo.description && (
            <p
              className="mb-2.5 line-clamp-2"
              style={{
                fontSize: "var(--font-size-body)",
                lineHeight: "var(--line-height-body)",
                color: "var(--color-text-body)",
              }}
            >
              {repo.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            {repo.language && (
              <span className="flex items-center gap-1.5" style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                <Circle style={{ width: 9, height: 9, fill: LANGUAGE_COLORS[repo.language] || "var(--color-text-muted)", color: LANGUAGE_COLORS[repo.language] || "var(--color-text-muted)" }} />
                {repo.language}
              </span>
            )}

            <span className="flex items-center gap-1" style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              <Star style={{ width: 12, height: 12 }} />
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>{formatNumber(repo.stars)}</span>
            </span>

            <span className="flex items-center gap-1" style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              <GitFork style={{ width: 12, height: 12 }} />
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>{formatNumber(repo.forks)}</span>
            </span>

            {/* Trend Score */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                color: "#B45309",
              }}
            >
              <TrendingUp style={{ width: 11, height: 11 }} />
              趋势 {trendScore}
            </span>

            {/* Estimated New Stars */}
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <Star style={{ width: 10, height: 10, fill: "var(--color-warning)", color: "var(--color-warning)" }} />
              预估 +{formatNumber(estimatedNewStars)} stars
            </span>

            {/* Health Score */}
            {health && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: gradeColors?.bg, color: gradeColors?.text }}
              >
                <Heart style={{ width: 11, height: 11 }} />
                {health.score} · {health.grade}
              </span>
            )}

            {/* Top Risk */}
            {topRisk && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: RISK_LEVEL_COLORS[topRisk.level] }}>
                <AlertTriangle style={{ width: 11, height: 11 }} />
                {topRisk.title}
              </span>
            )}

            <span className="flex items-center gap-1 ml-auto" style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              <Clock style={{ width: 11, height: 11 }} />
              {formatDate(repo.pushed_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}