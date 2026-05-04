import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { User, Key, Bot } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { AIProviderSelect } from "@/components/dashboard/AIProviderSelect";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="flex gap-6">
            <aside className="hidden md:block md:w-1/4 flex-shrink-0">
              <div className="sticky top-20">
                <DashboardSidebar />
              </div>
            </aside>

            <div className="flex-1 min-w-0 md:w-3/4 space-y-4">
              <div className="mb-6">
                <h1
                  className="text-lg"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  账号设置
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  管理你的个人信息和偏好
                </p>
              </div>

              {/* Personal Info */}
              <div className="card overflow-hidden">
                <div
                  className="flex items-center gap-2 px-5 py-3.5"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <User style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
                  <h2
                    className="text-sm"
                    style={{
                      color: "var(--color-text-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    个人信息
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      用户名
                    </label>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--color-text-heading)" }}
                    >
                      {session.user.name ?? "未设置"}
                    </p>
                  </div>
                  <div>
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      邮箱
                    </label>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--color-text-heading)" }}
                    >
                      {session.user.email ?? "未设置"}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Config */}
              <div className="card overflow-hidden">
                <div
                  className="flex items-center gap-2 px-5 py-3.5"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <Bot style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
                  <h2
                    className="text-sm"
                    style={{
                      color: "var(--color-text-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    AI 配置
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <AIProviderSelect />
                  <div>
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      自定义 API Key
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="password"
                        placeholder="输入你的 API Key"
                        className="input flex-1"
                      />
                      <button className="btn-primary">保存</button>
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      使用自己的 API Key 可以避免达到系统配额限制
                    </p>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="card overflow-hidden">
                <div
                  className="flex items-center gap-2 px-5 py-3.5"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <Key style={{ width: 18, height: 18, color: "var(--color-text-body)" }} />
                  <h2
                    className="text-sm"
                    style={{
                      color: "var(--color-text-heading)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    安全
                  </h2>
                </div>
                <div className="p-5">
                  <SignOutButton />
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
