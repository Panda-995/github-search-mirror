"use client";

import Link from "next/link";
import { Star, GitFork, TrendingUp, Crown } from "lucide-react";
import type { TrendingRepo } from "@/types";

interface TrendingCardProps {
  repo: TrendingRepo;
  rank: number;
}

export function TrendingCard({ repo, rank }: TrendingCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="rank-badge rank-badge-1">
          <Crown style={{ width: 16, height: 16 }} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="rank-badge rank-badge-2">
          <span style={{ fontSize: "var(--font-size-caption)", fontWeight: "var(--font-weight-bold)" }}>2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="rank-badge rank-badge-3">
          <span style={{ fontSize: "var(--font-size-caption)", fontWeight: "var(--font-weight-bold)" }}>3</span>
        </div>
      );
    }
    return (
      <div className="rank-badge rank-badge-other">
        <span style={{ fontSize: "var(--font-size-caption)", fontWeight: "var(--font-weight-bold)" }}>{rank}</span>
      </div>
    );
  };

  return (
    <div className="list-item-card flex items-start gap-4" style={{ padding: "20px 24px" }}>
      {/* Rank */}
      <div className="flex-shrink-0 pt-0.5">
        {getRankBadge(rank)}
      </div>

      <div className="min-w-0 flex-1">
        {/* Title */}
        <Link
          href={`/repo/${repo.owner}/${repo.name}`}
          className="transition-colors hover:underline"
          style={{
            fontSize: "var(--font-size-body)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-primary)",
          }}
        >
          {repo.owner}/<span style={{ fontWeight: "var(--font-weight-semibold)" }}>{repo.name}</span>
        </Link>

        {/* Description */}
        {repo.description && (
          <p
            className="mt-1 line-clamp-2"
            style={{
              fontSize: "var(--font-size-body)",
              lineHeight: "var(--line-height-body)",
              color: "var(--color-text-body)",
            }}
          >
            {repo.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-6 mt-2 flex-wrap">
          <span
            className="flex items-center gap-1"
            style={{
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            <Star style={{ width: 12, height: 12 }} />
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
            <GitFork style={{ width: 12, height: 12 }} />
            <span style={{ fontWeight: "var(--font-weight-medium)" }}>
              {formatNumber(repo.forks)}
            </span>
          </span>

          {repo.language && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {repo.language}
            </span>
          )}

          {/* Trending data - green with up icon */}
          <span
            className="flex items-center gap-1 ml-auto data-badge"
          >
            <TrendingUp style={{ width: 14, height: 14 }} />
            +{formatNumber(repo.stars_today)}
          </span>
        </div>
      </div>
    </div>
  );
}
