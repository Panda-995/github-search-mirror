import Link from "next/link";
import { FolderHeart, Lock, Globe } from "lucide-react";
import { setCollectionVisibility } from "@/server/user.actions";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    isPublic: boolean | null;
    count: number;
  };
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <Link href={`/collection/${collection.id}`} className="flex min-w-0 flex-1 items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          <FolderHeart style={{ width: 20, height: 20 }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold" style={{ color: "var(--color-text-heading)" }}>
              {collection.name}
            </h3>
            {collection.isPublic ? (
              <Globe style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
            ) : (
              <Lock style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {collection.count} 个项目
          </p>
        </div>
      </Link>
      <form action={setCollectionVisibility.bind(null, collection.id, !collection.isPublic)}>
        <button type="submit" className="btn-secondary text-xs whitespace-nowrap">
          {collection.isPublic ? (
            <Lock style={{ width: 12, height: 12 }} />
          ) : (
            <Globe style={{ width: 12, height: 12 }} />
          )}
          {collection.isPublic ? "设为私密" : "设为公开"}
        </button>
      </form>
    </div>
  );
}
