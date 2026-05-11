export interface RepoHealth {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  metrics: RepoHealthMetrics;
  risks: RiskItem[];
  suggestions: string[];
}

export interface RepoHealthMetrics {
  activityScore: number;
  communityScore: number;
  maintenanceScore: number;
  documentationScore: number;
  securityScore: number;
}

export interface RiskItem {
  level: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface RepoForHealth {
  full_name?: string;
  name?: string;
  owner?: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  description: string | null;
  license: { name: string } | null;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  homepage: string | null;
  topics?: string[];
  has_readme?: boolean;
  has_contributing?: boolean;
  has_license_file?: boolean;
  archived?: boolean;
  disabled?: boolean;
}

function daysSince(dateStr: string): number {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  return Math.max(0, Math.floor((now - date) / (1000 * 60 * 60 * 24)));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateRepoHealth(repo: RepoForHealth): RepoHealth {
  const metrics = calculateMetrics(repo);
  const score = clampScore(
    metrics.activityScore * 0.25 +
    metrics.communityScore * 0.25 +
    metrics.maintenanceScore * 0.2 +
    metrics.documentationScore * 0.15 +
    metrics.securityScore * 0.15
  );

  const grade = scoreToGrade(score);
  const risks = detectRisks(repo, metrics);
  const suggestions = generateSuggestions(repo, metrics, risks);

  return {
    score,
    grade,
    label: getGradeLabel(grade),
    metrics,
    risks,
    suggestions,
  };
}

function calculateMetrics(repo: RepoForHealth): RepoHealthMetrics {
  const daysSincePush = daysSince(repo.pushed_at);
  const daysSinceCreate = Math.max(daysSince(repo.created_at), 1);

  const activityScore = clampScore(
    daysSincePush <= 7 ? 100 :
    daysSincePush <= 30 ? 90 :
    daysSincePush <= 90 ? 70 :
    daysSincePush <= 180 ? 50 :
    daysSincePush <= 365 ? 30 : 10
  );

  const starsPerDay = repo.stargazers_count / daysSinceCreate;
  const communityScore = clampScore(
    repo.stargazers_count >= 10000 ? 100 :
    repo.stargazers_count >= 5000 ? 90 :
    repo.stargazers_count >= 1000 ? 80 :
    repo.stargazers_count >= 100 ? 60 :
    repo.stargazers_count >= 10 ? 40 : 20
  );

  const issueRatio = repo.stargazers_count > 0
    ? repo.open_issues_count / repo.stargazers_count
    : repo.open_issues_count > 50 ? 1 : 0.1;
  const maintenanceScore = clampScore(
    issueRatio <= 0.01 ? 95 :
    issueRatio <= 0.05 ? 80 :
    issueRatio <= 0.1 ? 65 :
    issueRatio <= 0.2 ? 45 : 25
  );

  let docScore = 50;
  if (repo.has_readme) docScore += 20;
  if (repo.has_contributing) docScore += 15;
  if (repo.description && repo.description.length > 30) docScore += 10;
  if (repo.homepage) docScore += 5;
  const documentationScore = clampScore(docScore);

  let secScore = 50;
  if (repo.has_license_file || repo.license) secScore += 25;
  if (repo.archived) secScore -= 30;
  if (repo.disabled) secScore -= 50;
  if (daysSincePush <= 90) secScore += 10;
  const securityScore = clampScore(secScore);

  return {
    activityScore,
    communityScore,
    maintenanceScore,
    documentationScore,
    securityScore,
  };
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function getGradeLabel(grade: string): string {
  switch (grade) {
    case "A": return "优秀";
    case "B": return "良好";
    case "C": return "一般";
    case "D": return "较差";
    case "F": return "危险";
    default: return "未知";
  }
}

function detectRisks(repo: RepoForHealth, metrics: RepoHealthMetrics): RiskItem[] {
  const risks: RiskItem[] = [];

  const daysSincePush = daysSince(repo.pushed_at);
  if (daysSincePush > 365) {
    risks.push({
      level: "critical",
      title: "长期未维护",
      description: `项目已超过 ${Math.floor(daysSincePush / 30)} 个月未更新，可能存在安全漏洞`,
    });
  } else if (daysSincePush > 180) {
    risks.push({
      level: "high",
      title: "维护不活跃",
      description: `项目已 ${Math.floor(daysSincePush / 30)} 个月未更新，建议关注维护状态`,
    });
  } else if (daysSincePush > 90) {
    risks.push({
      level: "medium",
      title: "更新频率低",
      description: ["最近一次更新在", Math.floor(daysSincePush), "天前"].join(""),
    });
  }

  if (!repo.license && !repo.has_license_file) {
    risks.push({
      level: "high",
      title: "缺少开源许可证",
      description: "项目未明确许可证，使用时存在法律风险",
    });
  }

  if (repo.stargazers_count < 10) {
    risks.push({
      level: "medium",
      title: "社区规模小",
      description: "Stars 不足 10，项目可能缺乏社区验证",
    });
  }

  const issueRatio = repo.stargazers_count > 0
    ? repo.open_issues_count / repo.stargazers_count
    : repo.open_issues_count;
  if (issueRatio > 0.2 && repo.open_issues_count > 10) {
    risks.push({
      level: "medium",
      title: "Issue 积压较多",
      description: "Open Issues 占比偏高，可能存在较多未解决问题",
    });
  }

  if (repo.archived) {
    risks.push({
      level: "critical",
      title: "项目已归档",
      description: "该项目已被归档，不再接受更新和贡献",
    });
  }

  if (repo.disabled) {
    risks.push({
      level: "critical",
      title: "项目已禁用",
      description: "该项目已被禁用或删除",
    });
  }

  if (!repo.description || repo.description.length < 20) {
    risks.push({
      level: "low",
      title: "项目描述简短",
      description: "缺乏详细的项目描述，难以快速了解用途",
    });
  }

  return risks;
}

function generateSuggestions(
  repo: RepoForHealth,
  metrics: RepoHealthMetrics,
  risks: RiskItem[]
): string[] {
  const suggestions: string[] = [];

  if (metrics.activityScore < 50) {
    suggestions.push("关注项目活跃度，确认是否仍在积极维护");
  }
  if (metrics.documentationScore < 50) {
    suggestions.push("项目文档较少，建议在投入前先评估学习成本");
  }
  if (!repo.license) {
    suggestions.push("使用前请确认开源许可合规性");
  }
  if (risks.some(r => r.level === "critical")) {
    suggestions.push("存在严重风险项，不建议用于生产环境");
  }

  if (suggestions.length === 0) {
    suggestions.push("项目整体健康度良好，适合评估使用");
  }

  return suggestions;
}

export function getTopRisk(risks: RiskItem[]): RiskItem | null {
  if (risks.length === 0) return null;
  const priority: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...risks].sort((a, b) => (priority[a.level] ?? 9) - (priority[b.level] ?? 9))[0];
}