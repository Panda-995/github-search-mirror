"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Loader2, FolderHeart, AlertCircle, Trash2, X } from "lucide-react";
import { getMyCollections, addFavoriteForUser, removeFavoriteByRepoForUser, getFavoriteByRepoForUser } from "@/server/user.actions";

interface Collection {
  id: string;
  name: string;
}

interface FavoriteButtonProps {
  repoFullName: string;
  repoMeta?: Record<string, unknown>;
}

export function FavoriteButton({ repoFullName, repoMeta }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [fetchingCollections, setFetchingCollections] = useState(false);
  const [error, setError] = useState("");
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Check if already favorited on mount
  useEffect(() => {
    getFavoriteByRepoForUser(repoFullName)
      .then((fav) => {
        setIsFavorited(!!fav);
      })
      .catch(() => {
        setIsFavorited(false);
      })
      .finally(() => setCheckingFavorite(false));
  }, [repoFullName]);

  // Fetch collections when form is shown
  useEffect(() => {
    if (!showForm) return;

    let cancelled = false;

    async function fetchCollections() {
      setFetchingCollections(true);
      setError("");
      try {
        const data = await getMyCollections();
        if (cancelled) return;
        if (Array.isArray(data)) {
          setCollections(data);
          if (data.length > 0 && !collectionId) {
            setCollectionId(data[0].id);
          }
        } else {
          setCollections([]);
        }
      } catch {
        if (cancelled) return;
        setError("加载收藏夹失败，请检查网络连接");
        setCollections([]);
      } finally {
        if (!cancelled) {
          setFetchingCollections(false);
        }
      }
    }

    fetchCollections();
    return () => { cancelled = true; };
  }, [showForm, collectionId]);

  // Close form when clicking outside
  useEffect(() => {
    if (!showForm) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm]);

  const handleToggleFavorite = async () => {
    if (isFavorited) {
      // Remove favorite
      setLoading(true);
      setError("");
      try {
        await removeFavoriteByRepoForUser(repoFullName);
        setIsFavorited(false);
        setShowForm(false);
        setCollectionId("");
      } catch {
        setError("取消收藏失败，请稍后重试");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Show form to select collection
    setShowForm(true);
  };

  const handleAddFavorite = async () => {
    if (!collectionId) {
      setError("请选择收藏夹");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addFavoriteForUser(collectionId, repoFullName, repoMeta);
      setIsFavorited(true);
      setShowForm(false);
    } catch {
      setError("收藏失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (checkingFavorite) {
    return (
      <button disabled className="btn-secondary">
        <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
        加载中
      </button>
    );
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={buttonRef}
        onClick={handleToggleFavorite}
        disabled={loading}
        className={isFavorited ? "btn-secondary" : "btn-primary"}
      >
        {loading ? (
          <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
        ) : isFavorited ? (
          <Trash2 style={{ width: 14, height: 14 }} />
        ) : (
          <Star style={{ width: 14, height: 14, fill: "none" }} />
        )}
        {isFavorited ? "取消收藏" : "收藏"}
      </button>

      {showForm && !isFavorited && (
        <div
          ref={formRef}
          className="card p-4"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 50,
            minWidth: 280,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-heading)" }}
            >
              <FolderHeart style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} />
              选择收藏夹
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {error && (
            <div
              className="flex items-center gap-1.5 text-xs mb-3 p-2 rounded"
              style={{ background: "#FEF2F2", color: "var(--color-error)" }}
            >
              <AlertCircle style={{ width: 12, height: 12 }} />
              {error}
            </div>
          )}

          {fetchingCollections ? (
            <div className="py-4 text-center">
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin mx-auto" />
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                加载中...
              </p>
            </div>
          ) : collections.length === 0 ? (
            <div className="py-3 text-center">
              <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
                暂无收藏夹
              </p>
              <a
                href="/dashboard/collections"
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                去创建收藏夹 →
              </a>
            </div>
          ) : (
            <>
              <select
                value={collectionId}
                onChange={(e) => {
                  setCollectionId(e.target.value);
                  setError("");
                }}
                className="input w-full mb-3"
              >
                {collections.map((collectionItem) => (
                  <option key={collectionItem.id} value={collectionItem.id}>
                    {collectionItem.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddFavorite}
                disabled={loading || !collectionId}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                ) : (
                  <Star style={{ width: 14, height: 14 }} />
                )}
                收藏到该收藏夹
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
