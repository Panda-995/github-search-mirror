import { BarChart3, Search, Users, MessageSquare, Star } from "lucide-react";

export default function AnalyticsPage() {
  const stats = [
    { label: "总搜索次数", value: "0", icon: Search, change: "+0%" },
    { label: "注册用户", value: "0", icon: Users, change: "+0%" },
    { label: "评论数", value: "0", icon: MessageSquare, change: "+0%" },
    { label: "收藏数", value: "0", icon: Star, change: "+0%" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: "var(--surface-900)" }}>
          数据统计
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--surface-400)" }}>
          平台运营数据概览
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon style={{ width: 16, height: 16, color: "var(--surface-400)" }} />
              <span className="text-xs" style={{ color: "var(--surface-400)" }}>
                {stat.change}
              </span>
            </div>
            <span className="text-2xl font-semibold" style={{ color: "var(--surface-900)" }}>
              {stat.value}
            </span>
            <p className="text-xs mt-1" style={{ color: "var(--surface-500)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="p-5"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--surface-700)" }}>
            搜索趋势
          </h2>
          <div className="h-48 flex items-center justify-center">
            <BarChart3 className="h-8 w-8" style={{ color: "var(--surface-300)" }} />
          </div>
        </div>

        <div
          className="p-5"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--surface-700)" }}>
            热门搜索词
          </h2>
          <div className="h-48 flex items-center justify-center">
            <Search className="h-8 w-8" style={{ color: "var(--surface-300)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
