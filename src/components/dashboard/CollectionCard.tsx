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
      className="flex items-start gap-4 rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <FolderHeart className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{collection.name}</h3>
          {collection.isPublic ? (
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {collection.count} 个项目
        </p>
      </div>
    </Link>
  );
}
