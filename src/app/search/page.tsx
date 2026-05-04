import { Suspense } from "react";
import { searchRepositories } from "@/server/search.actions";
import { SearchBox } from "@/components/search/SearchBox";
import { FilterPanel } from "@/components/search/FilterPanel";
import { RepoList } from "@/components/search/RepoList";
import { SortSelect } from "@/components/search/SortSelect";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Inbox, Sparkles, Filter } from "lucide-react";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    language?: string;
    stars?: string;
    forks?: string;
    updated?: string;
    sort?: string;
    page?: string;
  }>;
}

const HOT_KEYWORDS = ["react", "vue", "python", "docker", "ai", "typescript"];

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1", 10);

  const filters: Record<string, string> = {};
  if (params.language) filters.language = params.language;
  if (params.stars) filters.stars = params.stars;
  if (params.forks) filters.forks = params.forks;
  if (params.updated) filters.updated = params.updated;

  const sort = (params.sort as "stars" | "forks" | "updated" | undefined) || undefined;
  const perPage = 20;

  let results = null;
  let error = null;

  if (query) {
    try {
      results = await searchRepositories(query, filters, { page, perPage, sort });
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
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!query && !error && (
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
          <p
            className="text-sm mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            探索 GitHub 上数百万个开源项目
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {HOT_KEYWORDS.map((keyword) => (
              <a
                key={keyword}
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="tag"
              >
                {keyword}
              </a>
            ))}
          </div>
        </div>
      )}

      {query && results && results.total === 0 && !error && (
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <p className="text-sm" style={{ color: "var(--color-text-body)" }}>
            找到{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--color-text-heading)" }}
            >
              {results.total.toLocaleString()}
            </span>{" "}
            个结果
            {query && (
              <span style={{ color: "var(--color-text-muted)" }}>
                {" "}
                for &quot;{query}&quot;
              </span>
            )}
          </p>
          <SortSelect />
        </div>
      )}

      {results && results.total > 0 && <RepoList results={results} query={query} />}
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6 sm:py-8">
          {/* Search header */}
          <div className="card max-w-2xl mb-6 sm:mb-8 px-2 sm:px-0 p-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Search
                style={{ width: 18, height: 18, color: "var(--color-text-muted)" }}
              />
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
            <SearchBox />
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
              <div className="sticky top-20">
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
                <SearchResults searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
