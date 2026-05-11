import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getSearchHistory, clearSearchHistory } from "@/server/history.actions";
import { Search, Trash2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let history: { id: string; query: string; createdAt: Date | null }[] = [];

  try {
    history = await getSearchHistory(session.user.id);
  } catch {
    history = [];
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="flex gap-6">
            <aside className="hidden md:block md:w-1/4 flex-shrink-0 self-start">
              <div className="sticky top-[64px]">
                <DashboardSidebar />
              </div>
            </aside>

            <div className="flex-1 min-w-0 md:w-3/4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1
                    className="text-lg"
                    style={{
                      color: "var(--color-text-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    搜索历史
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    你最近的搜索记录
                  </p>
                </div>
                {history.length > 0 && (
                  <form action={clearSearchHistory.bind(null, session.user.id)}>
                    <button
                      type="submit"
                      className="btn-secondary text-xs"
                      style={{ color: "var(--color-error)" }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      清除历史
                    </button>
                  </form>
                )}
              </div>

              {history.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 px-4">
                  {/* Empty state illustration placeholder */}
                  <div
                    className="flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
                    style={{ background: "var(--color-bg-hover)" }}
                  >
                    <Clock style={{ width: 24, height: 24, color: "var(--color-text-muted)" }} />
                  </div>
                  <p
                    className="text-base font-medium mb-1"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    还没有搜索记录
                  </p>
                  <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
                    去搜索页面开始探索吧！
                  </p>
                  <Link href="/search" className="btn-primary">
                    去搜索
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <Link
                      key={item.id}
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      className="list-item-card flex items-center gap-3"
                      style={{ padding: "16px 24px" }}
                    >
                      <Search style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
                      <span
                        className="flex-1 text-sm"
                        style={{ color: "var(--color-text-heading)" }}
                      >
                        {item.query}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
