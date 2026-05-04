import { SearchBox } from "@/components/search/SearchBox";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, GitBranch, Zap, ArrowRight, Search, Globe, Shield, Clock, Layers, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Search,
    title: "智能搜索",
    description: "基于 Meilisearch 的高效全文检索，支持多维度筛选与排序",
  },
  {
    icon: Globe,
    title: "AI 解读",
    description: "自动翻译项目描述，智能生成项目摘要，降低语言门槛",
  },
  {
    icon: Shield,
    title: "趋势追踪",
    description: "实时追踪 GitHub 热门项目，按日/周/月维度呈现趋势榜单",
  },
  {
    icon: Clock,
    title: "极速响应",
    description: "Redis 缓存加速，GitHub API 兜底，确保搜索体验流畅稳定",
  },
];

const TREND_TABS = [
  {
    href: "/trending?range=daily",
    label: "日趋势",
    icon: TrendingUp,
    desc: "今日热门",
  },
  {
    href: "/trending?range=weekly",
    label: "周趋势",
    icon: Calendar,
    desc: "本周飙升",
  },
  {
    href: "/trending?range=monthly",
    label: "月趋势",
    icon: BarChart3,
    desc: "月度精选",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="page-container" style={{ paddingTop: 80, paddingBottom: 48 }}>
          <div className="max-w-3xl mx-auto text-center px-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 badge badge-indigo mb-4 sm:mb-6">
              <Sparkles style={{ width: 12, height: 12 }} />
              AI 驱动的 GitHub 搜索体验
            </div>

            {/* Title */}
            <h1
              className="font-extrabold tracking-tight mb-4"
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                color: "var(--color-text-heading)",
                lineHeight: "var(--line-height-h1)",
              }}
            >
              发现优质开源项目
            </h1>

            {/* Subtitle */}
            <p
              className="text-base mb-8 leading-relaxed"
              style={{
                color: "var(--color-text-body)",
                lineHeight: "var(--line-height-body)",
              }}
            >
              智能搜索加速，AI 深度解读，让探索开源世界更高效
            </p>

            {/* Search Box - 64px large */}
            <div className="px-2 sm:px-0">
              <SearchBox size="large" />
            </div>

            {/* Quick stats */}
            <div
              className="mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs flex-wrap"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="flex items-center gap-1">
                <GitBranch style={{ width: 14, height: 14 }} />
                GitHub API
              </span>
              <span className="flex items-center gap-1">
                <Zap style={{ width: 14, height: 14 }} />
                极速搜索
              </span>
              <span className="flex items-center gap-1">
                <Sparkles style={{ width: 14, height: 14 }} />
                AI 翻译
              </span>
            </div>
          </div>
        </section>

        {/* Trending Section - No divider, seamless transition */}
        <section className="page-container" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6 sm:mb-8 px-2 sm:px-0">
              <div>
                <h2
                  className="text-base sm:text-lg font-semibold"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  趋势发现
                </h2>
                <p
                  className="text-xs sm:text-sm mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  追踪最热门的开源项目动态
                </p>
              </div>
              <Link href="/trending" className="btn-ghost">
                查看全部
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            {/* Trend cards - 3 cards with icon底板, consistent with features */}
            <div className="grid grid-cols-3 gap-4 sm:gap-5 px-2 sm:px-0">
              {TREND_TABS.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="card flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 text-center group"
                >
                  {/* Icon底板 - 48px, 主色10%透明度背景 */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--color-primary-alpha-10)",
                    }}
                  >
                    <tab.icon style={{ width: 22, height: 22, color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <h3
                      className="text-sm sm:text-base font-semibold"
                      style={{ color: "var(--color-text-heading)" }}
                    >
                      {tab.label}
                    </h3>
                    <p
                      className="text-xs sm:text-sm hidden sm:block mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {tab.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - 2x2 grid with icon底板 */}
        <section className="page-container" style={{ paddingTop: 80, paddingBottom: 100 }}>
          <div className="max-w-4xl mx-auto px-2 sm:px-0">
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 badge badge-indigo mb-4 sm:mb-5">
                <Layers style={{ width: 14, height: 14 }} />
                核心能力
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{
                  color: "var(--color-text-heading)",
                  lineHeight: "var(--line-height-h2)",
                }}
              >
                为开发者打造的高效工具
              </h2>
              <p
                className="text-sm sm:text-base"
                style={{ color: "var(--color-text-body)" }}
              >
                整合多种技术能力，提供一站式的开源项目探索体验
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:gap-8">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="card flex flex-col items-start gap-4 p-5 sm:p-8"
                >
                  {/* Icon底板 - 56px, 主色10%透明度背景 */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: "var(--color-primary-alpha-10)",
                    }}
                  >
                    <feature.icon style={{ width: 26, height: 26, color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-semibold mb-2"
                      style={{ color: "var(--color-text-heading)" }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed hidden sm:block"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
