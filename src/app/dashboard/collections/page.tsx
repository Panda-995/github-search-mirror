import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCollections, getFavorites, createCollection } from "@/server/user.actions";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { FolderHeart, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

interface CollectionItem {
  id: string;
  name: string;
  isPublic: boolean | null;
}

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const collections = await getCollections(session.user.id);
  const collectionsWithCount = await Promise.all(
    collections.map(async (item: CollectionItem) => {
      const favs = await getFavorites(session.user.id, item.id);
      return { ...item, count: favs.length };
    })
  );

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
                    收藏夹
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    管理你收藏的项目
                  </p>
                </div>
                {/* Create Collection Button */}
                <form
                  action={async (formData) => {
                    "use server";
                    const name = formData.get("name") as string;
                    const isPublic = formData.get("isPublic") === "on";
                    if (name && session?.user?.id) {
                      await createCollection(session.user.id, name, isPublic);
                      redirect("/dashboard/collections");
                    }
                  }}
                  className="flex flex-wrap items-center gap-2 justify-end"
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="新收藏夹名称"
                    required
                    className="input"
                    style={{ width: 160 }}
                  />
                  <label
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <input type="checkbox" name="isPublic" />
                    公开
                  </label>
                  <button type="submit" className="btn-primary">
                    <Plus style={{ width: 16, height: 16 }} />
                    创建
                  </button>
                </form>
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
                    创建收藏夹来整理你喜欢的项目
                  </p>
                  <Link href="/search" className="btn-primary">
                    去搜索项目
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {collectionsWithCount.map((item) => (
                    <CollectionCard key={item.id} collection={item} />
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
