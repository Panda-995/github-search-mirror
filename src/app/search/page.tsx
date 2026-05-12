import { Suspense } from "react";
import { searchRepositories } from "@/server/search.actions";
import { saveSearchHistory } from "@/server/history.actions";
import { SearchBox } from "@/components/search/SearchBox";
import { RepoList } from "@/components/search/RepoList";
import { SortSelect } from "@/components/search/SortSelect";
import { AIRecommendationPanel } from "@/components/search/AIRecommendationPanel";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGitHubTokenForUser } from "@/server/github-token";
import { buildSearchRequest } from "@/lib/search-request";

interface SearchParams {
  q?: string;
  language?: string;
  stars?: string;
  forks?: string;
  updated?: string;
  sort?: string;
  order?: string;
  page?: string;
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>;
}

const HOT_KEYWORDS = ["react", "vue", "python", "docker", "ai", "typescript"];

async function SearchResults({ params }: { params: SearchParams }) {
  const searchRequest = buildSearchRequest(params);

  let results = null;
  let error = null;

  if (searchRequest.normalizedQuery) {
    try {
      const session = await getServerSession(authOptions);
      const token = await getGitHubTokenForUser(session?.user?.id);
      results = await searchRepositories(
        searchRequest.searchQuery,
        searchRequest.filters,
        {
          page: searchRequest.page,
          perPage: searchRequest.perPage,
          sort: searchRequest.sort,
          order: searchRequest.order,
        },
        token
      );
      if (session?.user?.id) {
        try {
          await saveSearchHistory(
            session.user.id,
            searchRequest.normalizedQuery,
            searchRequest.filters
          );
        } catch {
          // Ignore history save errors
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "搜索失败";
    }
  }

  return (
    <>
      {error && (
        <div
          className="mb-6 p-4"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "var(--shadow-base)",
            color: "var(--color-error)",
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle style={{ width: 16, height: 16 }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">搜索服务暂时不可用</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                提示：请确保已配置 GitHub Token 环境变量
              </p>
            </div>
          </div>
        </div>
      )}

      {!searchRequest.normalizedQuery && !error && (
        <div
          className="flex flex-col items-center justify-center px-4 py-12 sm:py-16"
          style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "var(--shadow-base)",
          }}
        >
          <div
            className="flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
            style={{ background: "var(--color-bg-hover)" }}
          >
            <Sparkles style={{ width: 24, height: 24, color: "var(--color-primary)" }} />
          </div>
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "var(--color-text-heading)" }}
          >
            输入关键词开始搜索
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            探索 GitHub 上数百万个开源项目
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {HOT_KEYWORDS.map((keyword) => (
              <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`} className="tag">
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      )}

      {searchRequest.normalizedQuery && results && results.total === 0 && !error && (
        <div
          className="flex flex-col items-center justify-center px-4 py-16 sm:py-20"
          style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "var(--shadow-base)",
          }}
        >
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
            未找到相关项目
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            尝试更换关键词或调整筛选条件
          </p>
        </div>
      )}

      {results && results.total > 0 && (
        <>
          <div
            className="mb-4 flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--color-bg-card)",
              boxShadow: "var(--shadow-base)",
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-heading)" }}>
                {results.total.toLocaleString()} 个结果
              </p>
              {searchRequest.normalizedQuery && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  &quot;{searchRequest.normalizedQuery}&quot;
                </p>
              )}
            </div>
            <SortSelect />
          </div>
          <RepoList results={results} searchParams={params} />
          <AIRecommendationPanel repos={results.results.slice(0, 10)} query={params.q} />
        </>
      )}
    </>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <>
      <Header initialSearchQuery={params.q ?? ""} />
      <main className="flex-1 min-h-screen" style={{ background: "var(--color-bg-page)" }}>
        <div className="page-container py-6 sm:py-8">
          {/* Search header */}
          <div
            className="relative mb-5 overflow-visible rounded-2xl p-4 sm:mb-6 sm:p-5"
            style={{
              zIndex: 40,
              background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,242,255,0.78))",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--color-primary-light)" }}
                >
                  <Search style={{ width: 17, height: 17, color: "var(--color-primary)" }} />
                </span>
                <div className="min-w-0">
                  <h1
                    className="text-base font-semibold sm:text-lg"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    搜索项目
                  </h1>
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {params.q ? `当前关键词：${params.q}` : "输入关键词开始探索开源项目"}
                  </p>
                </div>
              </div>
            </div>
            <SearchBox initialQuery={params.q ?? ""} maxWidth="100%" />
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start">
            <SearchSidebar />

            {/* Results - 9 columns on desktop */}
            <div className="min-w-0 flex-1">
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="card p-4">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                }
              >
                <SearchResults params={params} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
