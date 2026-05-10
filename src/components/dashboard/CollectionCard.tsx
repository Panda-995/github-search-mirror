"use client";

import Link from "next/link";
import { FolderHeart, Lock, Globe } from "lucide-react";

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
    <Link
      href={`/collection/${collection.id}`}
      className="card flex items-start gap-4 p-5 group"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
      >
        <FolderHeart style={{ width: 20, height: 20 }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold"
            style={{ color: "var(--color-text-heading)" }}
          >
            {collection.name}
          </h3>
          {collection.isPublic ? (
            <Globe style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
          ) : (
            <Lock style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
          )}
        </div>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {collection.count} 个项目
        </p>
      </div>
    </Link>
  );
}
