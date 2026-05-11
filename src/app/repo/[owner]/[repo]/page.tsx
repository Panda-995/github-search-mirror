import { Suspense } from "react";
import { getRepo, getRepoReadme } from "@/lib/github";
import { ReadmeViewer } from "@/components/repo/ReadmeViewer";
import { AIPanel } from "@/components/repo/AIPanel";
import { RepoHealthCard } from "@/components/repo/RepoHealthCard";
import { FavoriteButton } from "@/components/repo/FavoriteButton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentGitHubToken } from "@/server/github-token";
import {
  Star,
  GitFork,
  Eye,
  Circle,
  Calendar,
  ExternalLink,
  BookOpen,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface RepoPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
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

async function RepoContent({ owner, repo }: { owner: string; repo: string }) {
  let repoData = null;
  let readme = "";
  let error = null;

  try {
    const token = await getCurrentGitHubToken();
    repoData = await getRepo(owner, repo, token);
    try {
      readme = await getRepoReadme(owner, repo, token);
    } catch {
      readme = "";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "获取项目信息失败";
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div
          className="card p-6 flex items-start gap-3"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
            color: "var(--color-error)",
          }}
        >
          <AlertCircle style={{ width: 18, height: 18 }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">获取项目信息失败</p>
            <p className="text-xs mt-1 opacity-80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!repoData) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <BookOpen
          style={{ width: 40, height: 40, color: "var(--color-bg-hover)" }}
          className="mx-auto mb-4"
        />
        <p className="text-base font-medium" style={{ color: "var(--color-text-body)" }}>
          项目未找到
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          请检查项目路径是否正确
        </p>
        <Link href="/search" className="btn-ghost inline-block mt-4">
          返回搜索
        </Link>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const githubUserUrl = `https://github.com/${repoData.owner.login}`;

  return (
    <>
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1 mb-4 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Link href="/" className="transition-colors hover:text-[var(--color-primary)]">
          首页
        </Link>
        <ChevronRight style={{ width: 14, height: 14 }} />
        <Link href="/search" className="transition-colors hover:text-[var(--color-primary)]">
          搜索
        </Link>
        <ChevronRight style={{ width: 14, height: 14 }} />
        <span style={{ color: "var(--color-text-body)" }}>{repoData.name}</span>
      </nav>

      {/* Repo Header Card */}
      <div className="card mb-4 sm:mb-6 overflow-hidden">
        {/* Top section */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: Owner/Name + GitHub button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <a
                  href={githubUserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70 flex-shrink-0"
                  style={{
                    fontSize: "var(--font-size-body)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-primary)",
                  }}
                >
                  <img
                    src={repoData.owner.avatar_url}
                    alt={repoData.owner.login}
                    className="w-5 h-5 rounded-full"
                  />
                  {repoData.owner.login}
                </a>
                <span style={{ color: "var(--color-border)" }} className="flex-shrink-0">
                  /
                </span>
                <h1
                  className="text-lg sm:text-xl"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {repoData.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Favorite Button */}
                <FavoriteButton
                  repoFullName={`${owner}/${repo}`}
                  repoMeta={{
                    name: repoData.name,
                    owner: repoData.owner.login,
                    description: repoData.description,
                    stars: repoData.stargazers_count,
                    language: repoData.language,
                  }}
                />
                {/* GitHub link */}
                <a
                  href={repoData.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink style={{ width: 14, height: 14 }} />在 GitHub 上查看
                </a>
              </div>
            </div>

            {/* Row 2: Description */}
            {repoData.description && (
              <p
                style={{
                  fontSize: "var(--font-size-body)",
                  lineHeight: "var(--line-height-body)",
                  color: "var(--color-text-body)",
                }}
              >
                {repoData.description}
              </p>
            )}

            {/* Row 3: Topics */}
            {repoData.topics && repoData.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {repoData.topics.map((topic: string) => (
                  <a
                    key={topic}
                    href={`/search?q=${encodeURIComponent(topic)}`}
                    className="badge badge-indigo transition-colors hover:opacity-80"
                  >
                    {topic}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-3 flex-wrap"
          style={{
            background: "var(--color-bg-page)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-body)" }}>
            <Star style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
            <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
              {formatNumber(repoData.stargazers_count)}
            </span>
            <span className="hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
              stars
            </span>
          </span>

          <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-body)" }}>
            <GitFork style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
            <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
              {formatNumber(repoData.forks_count)}
            </span>
            <span className="hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
              forks
            </span>
          </span>

          <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-body)" }}>
            <Eye style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
            <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
              {formatNumber(repoData.watchers_count)}
            </span>
            <span className="hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
              watchers
            </span>
          </span>

          {repoData.language && (
            <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-body)" }}>
              <Circle
                style={{
                  width: 10,
                  height: 10,
                  fill: LANGUAGE_COLORS[repoData.language] || "var(--color-text-muted)",
                  color: LANGUAGE_COLORS[repoData.language] || "var(--color-text-muted)",
                }}
              />
              {repoData.language}
            </span>
          )}

          <span
            className="flex items-center gap-1.5 ml-auto"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Calendar style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">更新于 </span>
            {formatDate(repoData.pushed_at)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* README */}
        <div className="lg:col-span-2">
          <ReadmeViewer
            content={readme}
            owner={repoData.owner.login}
            repoName={repoData.name}
            defaultBranch={repoData.default_branch}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5">
          <AIPanel
            repoFullName={`${owner}/${repo}`}
            readme={readme}
            description={repoData.description || ""}
          />
          <RepoHealthCard repo={repoData as unknown as import("@/lib/repo-insights").RepoForHealth} />
        </div>
      </div>
    </>
  );
}

export default function RepoPage({ params }: RepoPageProps) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6 sm:py-8">
          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="card p-6">
                  <Skeleton className="h-7 w-72 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full" />
                  </div>
                  <div className="space-y-5">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                </div>
              </div>
            }
          >
            <RepoContentWrapper params={params} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function RepoContentWrapper({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  return <RepoContent owner={owner} repo={repo} />;
}
