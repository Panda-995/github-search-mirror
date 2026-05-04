import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCollections, getFavorites } from "@/server/user.actions";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { FolderHeart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let collectionsWithCount: { id: string; name: string; isPublic: boolean | null; count: number }[] = [];

  try {
    const collections = await getCollections(session.user.id);
    collectionsWithCount = await Promise.all(
      collections.map(async (col) => {
        const favs = await getFavorites(session.user.id, col.id);
        return { ...col, count: favs.length };
      })
    );
  } catch {
    collectionsWithCount = [];
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

            <div className="flex-1 min-w-0 md:w-3/4">
              <div className="mb-6">
                <h1
                  className="text-lg"
                  style={{
                    color: "var(--color-text-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  收藏夹
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  管理你收藏的项目
                </p>
              </div>

              {collectionsWithCount.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 px-4">
                  <div
                    className="flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
                    style={{ background: "var(--color-bg-hover)" }}
                  >
                    <FolderHeart
                      style={{ width: 24, height: 24, color: "var(--color-text-muted)" }}
                    />
                  </div>
                  <p
                    className="text-base font-medium mb-1"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    还没有收藏夹
                  </p>
                  <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
                    去项目详情页收藏项目吧！
                  </p>
                  <Link href="/search" className="btn-primary">
                    去搜索
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {collectionsWithCount.map((col) => (
                    <CollectionCard key={col.id} collection={col} />
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
