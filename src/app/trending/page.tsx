import { Suspense } from "react";
import { getTrendingRepos } from "@/server/trending.actions";
import { TrendingCard } from "@/components/search/TrendingCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Inbox, Filter, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { parseTrendingRange } from "@/lib/search-params";
import { getCurrentGitHubToken } from "@/server/github-token";

interface TrendingPageProps {
  searchParams: Promise<{
    range?: string;
    language?: string;
    sort?: string;
  }>;
}

const RANGES = [
  { label: "今日", value: "daily" },
  { label: "本周", value: "weekly" },
  { label: "本月", value: "monthly" },
];

const LANGUAGES = [
  { label: "全部", value: "" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "C++", value: "c++" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "Vue", value: "vue" },
];

const SORTS = [
  { label: "热度", value: "trend" },
  { label: "Stars", value: "stars" },
  { label: "最近更新", value: "updated" },
];

async function TrendingResults({ searchParams }: TrendingPageProps) {
  const params = await searchParams;
  const range = parseTrendingRange(params.range);
  const language = params.language || "";
  const sort = params.sort || "trend";

  let repos: Awaited<ReturnType<typeof getTrendingRepos>> = [];
  let error = null;

  try {
    repos = await getTrendingRepos(range, language || undefined, await getCurrentGitHubToken());
  } catch (e) {
    error = e instanceof Error ? e.message : "获取趋势失败";
  }

  // Sort repos based on selection
  const sorted = [...repos].sort((a, b) => {
    if (sort === "stars") return b.stars - a.stars;
    if (sort === "updated") return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    return (b.trend_score || 0) - (a.trend_score || 0);
  });

  return (
    <>
      {error && (
        <div
          className="card p-4 mb-6"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
            color: "var(--color-error)",
          }}
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && sorted.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 px-4">
          <div
            className="flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
            style={{ background: "var(--color-bg-hover)" }}
          >
            <Inbox style={{ width: 24, height: 24, color: "var(--color-text-muted)" }} />
          </div>
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "var(--color-text-heading)" }}
          >
            暂无趋势数据
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            请检查 GitHub API 配置或稍后重试
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((repo, index) => (
          <TrendingCard key={repo.full_name} repo={repo} rank={index + 1} />
        ))}
      </div>
    </>
  );
}

export default function TrendingPage({ searchParams }: TrendingPageProps) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6 px-2 sm:px-0">
            <TrendingUp style={{ width: 20, height: 20, color: "var(--color-text-muted)" }} />
            <h1
              className="text-base sm:text-lg"
              style={{
                color: "var(--color-text-heading)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              趋势榜单
            </h1>
          </div>

          {/* Sliding Pill Tabs - Range */}
          <div className="tab-pill-container mb-4 mx-2 sm:mx-0 flex-wrap">
            {RANGES.map((range) => (
              <TabLink
                key={range.value}
                paramKey="range"
                value={range.value}
                label={range.label}
                searchParams={searchParams}
              />
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-2 mb-3 mx-2 sm:mx-0">
            <Filter style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <TabLink
                  key={lang.value}
                  paramKey="language"
                  value={lang.value}
                  label={lang.label}
                  searchParams={searchParams}
                />
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-6 mx-2 sm:mx-0">
            <ArrowUpDown style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
            <div className="flex flex-wrap gap-1.5">
              {SORTS.map((s) => (
                <TabLink
                  key={s.value}
                  paramKey="sort"
                  value={s.value}
                  label={s.label}
                  searchParams={searchParams}
                />
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="px-2 sm:px-0">
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <TrendingResults searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function TabLink({
  paramKey,
  value,
  label,
  searchParams,
}: {
  paramKey: string;
  value: string;
  label: string;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const currentValue =
    paramKey === "range" ? parseTrendingRange(params.range) : (params[paramKey] || "");
  const isActive = currentValue === value;

  const buildUrl = () => {
    const searchParamMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== paramKey && k !== "page") searchParamMap[k] = v;
    }
    if (value) searchParamMap[paramKey] = value;
    const urlParams = new URLSearchParams(searchParamMap);
    const qs = urlParams.toString();
    return `/trending${qs ? "?" + qs : ""}`;
  };

  return (
    <Link href={buildUrl()} className={`tab-pill ${isActive ? "active" : ""}`}>
      {label}
    </Link>
  );
}