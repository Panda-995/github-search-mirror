import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Search, Star, GitFork, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const stats = [
    { label: "搜索次数", value: "0", icon: Search },
    { label: "收藏项目", value: "0", icon: Star },
    { label: "收藏夹", value: "0", icon: GitFork },
    { label: "评论数", value: "0", icon: TrendingUp },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="flex gap-6">
            {/* Sidebar - 3 columns */}
            <aside className="hidden md:block md:w-1/4 flex-shrink-0">
              <div className="sticky top-20">
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
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
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

              {/* Recent activity placeholder */}
              <div className="card p-5">
                <h2
                  className="text-sm mb-4"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  最近活动
                </h2>
                <div className="text-center py-8">
                  <Search
                    className="mx-auto h-8 w-8 mb-2"
                    style={{ color: "var(--color-bg-hover)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    暂无活动记录
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
