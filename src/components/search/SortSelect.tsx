"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Check } from "lucide-react";

const SORT_OPTIONS = [
  { value: "relevance", label: "相关度" },
  { value: "stars", label: "Stars" },
  { value: "forks", label: "Forks" },
  { value: "updated", label: "最近更新" },
];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "relevance";
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label || "相关度";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "relevance") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/search?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        style={{
          height: 36,
          padding: "0 12px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          fontSize: "var(--font-size-body)",
          color: "var(--color-text-body)",
          cursor: "pointer",
          transition: "all var(--duration-fast) var(--ease-out)",
        }}
      >
        <ArrowUpDown style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
        <span>{currentLabel}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 z-20 overflow-hidden"
            style={{
              minWidth: 160,
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors"
                style={{
                  background: currentSort === opt.value ? "var(--color-bg-hover)" : "transparent",
                  color: currentSort === opt.value ? "var(--color-text-heading)" : "var(--color-text-body)",
                }}
                onMouseEnter={(e) => {
                  if (currentSort !== opt.value) {
                    e.currentTarget.style.background = "var(--color-bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentSort !== opt.value) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span>{opt.label}</span>
                {currentSort === opt.value && (
                  <Check style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
