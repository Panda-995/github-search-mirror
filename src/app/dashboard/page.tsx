import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCollections, getFavorites } from "@/server/user.actions";
import { getSearchHistory } from "@/server/history.actions";
import { Search, Star, FolderHeart, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id;

  let searchCount = 0;
  let favoriteCount = 0;
  let collectionCount = 0;
  let recentSearches: { id: string; query: string; createdAt: Date | null }[] = [];

  if (userId) {
    try {
      const [history, collections, favorites] = await Promise.all([
        getSearchHistory(userId, 50),
        getCollections(userId),
        getFavorites(userId),
      ]);
      searchCount = history.length;
      collectionCount = collections.length;
      favoriteCount = favorites.length;
      recentSearches = history.slice(0, 5);
    } catch {
      // Graceful degradation
    }
  }

  const stats = [
    { label: "搜索次数", value: String(searchCount), icon: Search },
    { label: "收藏项目", value: String(favoriteCount), icon: Star },
    { label: "收藏夹", value: String(collectionCount), icon: FolderHeart },
    { label: "最近搜索", value: String(Math.min(searchCount, 50)), icon: Clock },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="flex gap-6">
            {/* Sidebar - 3 columns */}
            <aside className="hidden md:block md:w-1/4 flex-shrink-0 self-start">
              <div className="sticky top-[64px]">
                <DashboardSidebar />
              </div>
            </aside>

            {/* Main content - 9 columns */}
            <div className="flex-1 min-w-0 md:w-3/4">
              {/* Page header */}
              <div className="mb-6">
                <h1
                  className="text-lg"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  仪表盘
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  欢迎回来，{session.user?.name || "用户"}
                </p>
              </div>

              {/* Stats grid - 大数字卡片 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="card relative overflow-hidden"
                    style={{ height: 100, padding: "16px 20px" }}
                  >
                    {/* Background watermark icon */}
                    <stat.icon
                      className="absolute"
                      style={{
                        width: 48,
                        height: 48,
                        bottom: 8,
                        right: 8,
                        color: "var(--color-bg-hover)",
                        opacity: 0.6,
                      }}
                    />
                    <span
                      className="text-sm relative z-10"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="block relative z-10 mt-1"
                      style={{
                        fontSize: 36,
                        fontWeight: "var(--font-weight-bold)",
                        color: "var(--color-text-heading)",
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent Searches Activity */}
              <div className="card overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <h2
                    className="text-sm"
                    style={{
                      color: "var(--color-text-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    最近搜索
                  </h2>
                  <Link href="/dashboard/history" className="btn-ghost text-xs">
                    查看全部
                    <ArrowRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>

                {recentSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search
                      className="mx-auto h-8 w-8 mb-2"
                      style={{ color: "var(--color-bg-hover)" }}
                    />
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      暂无搜索记录
                    </p>
                    <Link href="/search" className="btn-primary inline-flex mt-3">
                      去搜索
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {recentSearches.map((item) => (
                      <Link
                        key={item.id}
                        href={`/search?q=${encodeURIComponent(item.query)}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-opacity-50"
                        style={{
                          color: "var(--color-text-body)",
                        }}
                      >
                        <Search
                          style={{ width: 14, height: 14, color: "var(--color-text-muted)" }}
                        />
                        <span className="text-sm flex-1">{item.query}</span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("zh-CN")
                            : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
