"use client";

import { calculateRepoHealth, getTopRisk } from "@/lib/repo-insights";
import type { RepoForHealth } from "@/lib/repo-insights";
import { Heart, Shield, AlertTriangle, CheckCircle, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface RepoHealthCardProps {
  repo: RepoForHealth;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  B: { bg: "#F0F9FF", text: "#0284C7", border: "#7DD3FC" },
  C: { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" },
  D: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
  F: { bg: "#FEF2F2", text: "#991B1B", border: "#EF4444" },
};

const RISK_LEVEL_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: "#FEE2E2", text: "#DC2626", icon: "#EF4444" },
  high: { bg: "#FEF3C7", text: "#D97706", icon: "#F59E0B" },
  medium: { bg: "#F0F9FF", text: "#0284C7", icon: "#0EA5E9" },
  low: { bg: "#F3F4F6", text: "#6B7280", icon: "#9CA3AF" },
};

export function RepoHealthCard({ repo }: RepoHealthCardProps) {
  const [expanded, setExpanded] = useState(false);
  const health = calculateRepoHealth(repo);
  const topRisk = getTopRisk(health.risks);
  const gradeColors = GRADE_COLORS[health.grade] || GRADE_COLORS.C;

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Heart style={{ width: 16, height: 16, color: "var(--color-text-body)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
          仓库健康
        </h3>
      </div>

      <div className="p-5">
        {/* Score Circle */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex items-center justify-center h-16 w-16 rounded-full flex-shrink-0"
            style={{
              background: gradeColors.bg,
              border: `3px solid ${gradeColors.border}`,
            }}
          >
            <div className="text-center">
              <div
                className="text-xl font-bold leading-tight"
                style={{ color: gradeColors.text }}
              >
                {health.score}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: gradeColors.text }}
              >
                {health.grade} · {health.label}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {topRisk && (
              <div
                className="flex items-start gap-1.5 p-2 rounded-lg text-xs"
                style={{
                  background: RISK_LEVEL_COLORS[topRisk.level].bg,
                  color: RISK_LEVEL_COLORS[topRisk.level].text,
                }}
              >
                <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <span className="font-medium">{topRisk.title}: </span>
                  {topRisk.description}
                </div>
              </div>
            )}
            {!topRisk && (
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: GRADE_COLORS.A.text }}
              >
                <CheckCircle style={{ width: 12, height: 12 }} />
                未检测到明显风险
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs w-full justify-center py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          {expanded ? (
            <>
              <ChevronUp style={{ width: 14, height: 14 }} />
              收起详情
            </>
          ) : (
            <>
              <ChevronDown style={{ width: 14, height: 14 }} />
              展开详情
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Metrics */}
            <div className="space-y-2">
              <MetricBar
                label="活跃度"
                value={health.metrics.activityScore}
                icon={<Activity style={{ width: 12, height: 12 }} />}
              />
              <MetricBar
                label="社区规模"
                value={health.metrics.communityScore}
                icon={<Heart style={{ width: 12, height: 12 }} />}
              />
              <MetricBar
                label="维护质量"
                value={health.metrics.maintenanceScore}
                icon={<Shield style={{ width: 12, height: 12 }} />}
              />
              <MetricBar
                label="文档完整度"
                value={health.metrics.documentationScore}
                icon={<CheckCircle style={{ width: 12, height: 12 }} />}
              />
              <MetricBar
                label="安全合规"
                value={health.metrics.securityScore}
                icon={<AlertTriangle style={{ width: 12, height: 12 }} />}
              />
            </div>

            {/* All Risks */}
            {health.risks.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-body)" }}>
                  风险详情
                </p>
                <div className="space-y-1.5">
                  {health.risks.map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 p-1.5 rounded text-xs"
                      style={{
                        background: RISK_LEVEL_COLORS[risk.level].bg,
                        color: RISK_LEVEL_COLORS[risk.level].text,
                      }}
                    >
                      <AlertTriangle
                        style={{
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                          marginTop: 1,
                          color: RISK_LEVEL_COLORS[risk.level].icon,
                        }}
                      />
                      <div>
                        <span className="font-medium">{risk.title}</span>
                        <span className="mx-1">·</span>
                        {risk.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {health.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-text-body)" }}>
                  使用建议
                </p>
                <ul className="space-y-1">
                  {health.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span className="mr-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const getBarColor = (v: number) => {
    if (v >= 80) return "#059669";
    if (v >= 60) return "#0284C7";
    if (v >= 40) return "#D97706";
    return "#DC2626";
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs w-16 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>
        {icon}
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-bg-hover)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: getBarColor(value),
          }}
        />
      </div>
      <span className="text-xs w-7 text-right font-medium" style={{ color: getBarColor(value) }}>
        {value}
      </span>
    </div>
  );
}