import { Suspense } from "react";
import { searchRepositories } from "@/server/search.actions";
import { saveSearchHistory } from "@/server/history.actions";
import { SearchBox } from "@/components/search/SearchBox";
import { FilterPanel } from "@/components/search/FilterPanel";
import { RepoList } from "@/components/search/RepoList";
import { SortSelect } from "@/components/search/SortSelect";
import { AIRecommendationPanel } from "@/components/search/AIRecommendationPanel";
import { SearchPresetPanel } from "@/components/search/SearchPresetPanel";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, Sparkles, Filter, AlertCircle } from "lucide-react";
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
          className="card p-4 mb-6"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
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
        <div className="card flex flex-col items-center justify-center py-12 sm:py-16 px-4">
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
              <a key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`} className="tag">
                {keyword}
              </a>
            ))}
          </div>
        </div>
      )}

      {searchRequest.normalizedQuery && results && results.total === 0 && !error && (
        <div className="card flex flex-col items-center justify-center py-16 sm:py-20 px-4">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <p className="text-sm" style={{ color: "var(--color-text-body)" }}>
              找到{" "}
              <span className="font-semibold" style={{ color: "var(--color-text-heading)" }}>
                {results.total.toLocaleString()}
              </span>{" "}
              个结果
              {searchRequest.normalizedQuery && (
                <span style={{ color: "var(--color-text-muted)" }}>
                  {" "}
                  for &quot;{searchRequest.normalizedQuery}&quot;
                </span>
              )}
            </p>
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
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6 sm:py-8">
          {/* Search header */}
          <div className="card max-w-2xl mb-6 sm:mb-8 px-2 sm:px-0 p-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Search style={{ width: 18, height: 18, color: "var(--color-text-muted)" }} />
              <h1
                className="text-base sm:text-lg"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                搜索项目
              </h1>
            </div>
            <SearchBox initialQuery={params.q ?? ""} />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Mobile filter toggle */}
            <div className="lg:hidden px-2">
              <Link
                href="/search"
                className="btn-secondary inline-flex items-center gap-2 text-sm font-medium px-3 py-2"
              >
                <Filter style={{ width: 14, height: 14 }} />
                筛选条件
              </Link>
            </div>

            {/* Sidebar filters - no border card, directly on bg */}
            <aside className="hidden lg:block lg:w-1/4 flex-shrink-0">
              <div className="sticky top-20 space-y-5">
                <SearchPresetPanel />
                <FilterPanel />
              </div>
            </aside>

            {/* Results - 9 columns on desktop */}
            <div className="flex-1 min-w-0 px-2 sm:px-0 lg:w-3/4">
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
