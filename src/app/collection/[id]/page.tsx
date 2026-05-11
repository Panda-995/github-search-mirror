import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCollectionById, getFavoritesByCollectionId } from "@/server/user.actions";
import { FolderHeart, Star, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

type CollectionRow = {
  id: string;
  name: string;
  isPublic: boolean | null;
  userId: string;
};

type FavoriteRow = {
  id: string;
  repoFullName: string;
  repoMeta: unknown;
  createdAt: Date | null;
};

function getRepoDescription(repoMeta: unknown) {
  if (!repoMeta || typeof repoMeta !== "object" || !("description" in repoMeta)) {
    return null;
  }

  const description = (repoMeta as { description?: unknown }).description;
  return typeof description === "string" && description ? description : null;
}

function CollectionUnavailable({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-16 text-center">
          <FolderHeart
            style={{ width: 48, height: 48, color: "var(--color-text-muted)" }}
            className="mx-auto mb-4"
          />
          <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-heading)" }}>
            收藏夹不存在
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            该收藏夹可能已被删除，或你没有访问权限
          </p>
          <Link href={isLoggedIn ? "/dashboard/collections" : "/search"} className="btn-primary">
            <ArrowLeft style={{ width: 14, height: 14 }} />
            返回
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const collection = (await getCollectionById(id)) as CollectionRow | null;

  if (!collection) {
    return <CollectionUnavailable isLoggedIn={Boolean(session?.user?.id)} />;
  }

  const ownsCollection = session?.user?.id === collection.userId;
  if (!collection.isPublic && !ownsCollection) {
    if (!session?.user?.id) redirect("/login");
    return <CollectionUnavailable isLoggedIn />;
  }

  const favorites = (await getFavoritesByCollectionId(collection.id)) as FavoriteRow[];

  const backHref = ownsCollection ? "/dashboard/collections" : "/search";
  const backLabel = ownsCollection ? "返回收藏夹列表" : "返回搜索";

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6">
          <div className="mb-6">
            <Link
              href={backHref}
              className="text-sm inline-flex items-center gap-1 mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              {backLabel}
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
              >
                <FolderHeart style={{ width: 24, height: 24 }} />
              </div>
              <div>
                <h1
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text-heading)" }}
                >
                  {collection.name}
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {favorites.length} 个项目 · {collection.isPublic ? "公开" : "私密"}
                </p>
              </div>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 px-4">
              <Star
                style={{ width: 32, height: 32, color: "var(--color-text-muted)" }}
                className="mb-4"
              />
              <p
                className="text-base font-medium mb-1"
                style={{ color: "var(--color-text-heading)" }}
              >
                还没有收藏项目
              </p>
              <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
                去搜索并收藏你喜欢的项目吧
              </p>
              <Link href="/search" className="btn-primary">
                去搜索
                <ExternalLink style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const description = getRepoDescription(fav.repoMeta);

                return (
                  <Link
                    key={fav.id}
                    href={`/repo/${fav.repoFullName}`}
                    className="card p-4 flex items-center gap-4 group"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "var(--color-bg-hover)" }}
                    >
                      <Star style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-medium text-sm"
                        style={{ color: "var(--color-text-heading)" }}
                      >
                        {fav.repoFullName}
                      </h3>
                      {description && (
                        <p
                          className="text-xs mt-0.5 truncate"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    <ExternalLink
                      style={{ width: 14, height: 14, color: "var(--color-text-muted)" }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
