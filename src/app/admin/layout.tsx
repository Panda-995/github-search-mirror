import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { BarChart3, Users, MessageSquare, Settings } from "lucide-react";

const adminNav = [
  { href: "/admin/analytics", label: "数据统计", icon: BarChart3 },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/comments", label: "评论审核", icon: MessageSquare },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden md:block w-52 flex-shrink-0">
              <div
                className="sticky top-20 py-2"
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div className="px-4 py-2 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--surface-400)" }}>
                    管理后台
                  </span>
                </div>
                <nav className="px-2">
                  {adminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                      style={{ color: "var(--surface-600)" }}
                    >
                      <item.icon style={{ width: 16, height: 16 }} />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
