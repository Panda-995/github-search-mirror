import { Suspense } from "react";
import { getTrendingRepos } from "@/server/trending.actions";
import { TrendingCard } from "@/components/search/TrendingCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Inbox } from "lucide-react";
import Link from "next/link";

interface TrendingPageProps {
  searchParams: Promise<{
    range?: string;
  }>;
}

const RANGES = [
  { label: "今日", value: "daily" },
  { label: "本周", value: "weekly" },
  { label: "本月", value: "monthly" },
];

async function TrendingResults({ searchParams }: TrendingPageProps) {
  const params = await searchParams;
  const range = (params.range || "daily") as "daily" | "weekly" | "monthly";

  let repos: Awaited<ReturnType<typeof getTrendingRepos>> = [];
  let error = null;

  try {
    repos = await getTrendingRepos(range);
  } catch (e) {
    error = e instanceof Error ? e.message : "获取趋势失败";
  }

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

      {!error && repos.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 px-4">
          <div
            className="flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
            style={{ background: "var(--color-bg-hover)" }}
          >
            <Inbox
              style={{ width: 24, height: 24, color: "var(--color-text-muted)" }}
            />
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
        {repos.map((repo, index) => (
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
            <TrendingUp
              style={{ width: 20, height: 20, color: "var(--color-text-muted)" }}
            />
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

          {/* Sliding Pill Tabs */}
          <div className="tab-pill-container mb-6 mx-2 sm:mx-0">
            {RANGES.map((range) => (
              <TabLink
                key={range.value}
                range={range.value}
                label={range.label}
                searchParams={searchParams}
              />
            ))}
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
  range,
  label,
  searchParams,
}: {
  range: string;
  label: string;
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const currentRange = params.range || "daily";
  const isActive = currentRange === range;

  return (
    <Link
      href={`/trending?range=${range}`}
      className={`tab-pill ${isActive ? "active" : ""}`}
    >
      {label}
    </Link>
  );
}
