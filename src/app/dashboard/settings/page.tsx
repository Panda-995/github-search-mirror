import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardErrorNotice } from "@/components/dashboard/DashboardErrorNotice";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { getUserSettings } from "@/server/settings.actions";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "设置加载失败，请稍后重试。";
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let settings: Awaited<ReturnType<typeof getUserSettings>> = null;
  let loadError = "";

  try {
    settings = await getUserSettings();
  } catch (error) {
    loadError = getErrorMessage(error);
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
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  管理你的个人信息和偏好
                </p>
              </div>

              {loadError ? (
                <DashboardErrorNotice
                  title="设置加载失败"
                  message={loadError}
                  actionHref="/dashboard/settings"
                />
              ) : (
                <SettingsForm
                  initialSettings={
                    settings ?? {
                      name: session.user.name ?? "",
                      githubToken: "",
                      githubTokenConfigured: false,
                      aiConfig: {
                        provider: "claude",
                        model: "",
                        apiEndpoint: "",
                        apiKey: "",
                        apiKeyConfigured: false,
                      },
                    }
                  }
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
