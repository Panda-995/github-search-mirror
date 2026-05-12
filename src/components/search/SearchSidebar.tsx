"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { SearchPresetPanel } from "./SearchPresetPanel";
import { FilterPanel } from "./FilterPanel";

const FILTER_KEYS = ["language", "stars", "forks", "updated"] as const;

function useActiveFilterCount() {
  const searchParams = useSearchParams();

  return useMemo(
    () => FILTER_KEYS.filter((key) => Boolean(searchParams.get(key))).length,
    [searchParams]
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-4">
      <SearchPresetPanel onNavigate={onNavigate} />
      <div
        className="p-4"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-base)",
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
            筛选条件
          </h2>
        </div>
        <FilterPanel onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function SearchSidebar() {
  const [open, setOpen] = useState(false);
  const activeFilterCount = useActiveFilterCount();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary w-full justify-between px-3 py-2 text-sm"
          aria-expanded={open}
          aria-controls="mobile-search-filters"
        >
          <span className="inline-flex items-center gap-2">
            <Filter style={{ width: 14, height: 14 }} />
            筛选与预设
          </span>
          {activeFilterCount > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }}>
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: "rgba(15, 23, 42, 0.38)", border: 0 }}
            aria-label="关闭筛选面板"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-search-filters"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col"
            style={{
              background: "var(--color-bg-page)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--color-text-heading)" }}
                >
                  筛选与预设
                </h2>
                {activeFilterCount > 0 && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    已启用 {activeFilterCount} 个筛选
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn"
                style={{ width: 36, height: 36 }}
                aria-label="关闭筛选面板"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden flex-shrink-0 lg:block lg:w-72">
        <div className="sticky top-20">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
