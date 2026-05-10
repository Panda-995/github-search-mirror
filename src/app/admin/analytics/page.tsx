import { BarChart3, Search, Users, MessageSquare, Star } from "lucide-react";
import { getAdminAnalytics } from "@/server/admin.actions";

export default async function AnalyticsPage() {
  const analytics = await getAdminAnalytics();
  const stats = [
    { label: "总搜索次数", value: analytics.searches.toLocaleString(), icon: Search },
    { label: "注册用户", value: analytics.users.toLocaleString(), icon: Users },
    { label: "评论数", value: analytics.comments.toLocaleString(), icon: MessageSquare },
    { label: "收藏数", value: analytics.favorites.toLocaleString(), icon: Star },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-heading)" }}>
          数据统计
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          平台运营数据概览
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "16px 20px" }}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
            </div>
            <span className="text-2xl font-semibold" style={{ color: "var(--color-text-heading)" }}>
              {stat.value}
            </span>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-heading)" }}>
            搜索趋势
          </h2>
          <div className="h-48 flex items-center justify-center">
            <BarChart3 style={{ width: 32, height: 32, color: "var(--color-bg-hover)" }} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-heading)" }}>
            热门搜索词
          </h2>
          <div className="space-y-2">
            {analytics.topKeywords.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <Search style={{ width: 32, height: 32, color: "var(--color-bg-hover)" }} />
              </div>
            ) : (
              analytics.topKeywords.map((item) => (
                <div
                  key={item.query}
                  className="flex items-center justify-between rounded-md px-3 py-2"
                  style={{ background: "var(--color-bg-page)" }}
                >
                  <span className="text-sm truncate" style={{ color: "var(--color-text-body)" }}>
                    {item.query}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
