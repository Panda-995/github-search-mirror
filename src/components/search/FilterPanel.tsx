"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
];

const STAR_RANGES = [
  { label: "任意", value: "" },
  { label: "> 100", value: ">100" },
  { label: "> 1,000", value: ">1000" },
  { label: "> 10,000", value: ">10000" },
];

const FORK_RANGES = [
  { label: "任意", value: "" },
  { label: "> 100", value: ">100" },
  { label: "> 1,000", value: ">1000" },
];

const UPDATE_RANGES = [
  { label: "任意", value: "" },
  { label: "最近一周", value: ">7d" },
  { label: "最近一月", value: ">30d" },
  { label: "最近一年", value: ">365d" },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4">
      {/* Section title - uppercase, muted, semibold */}
      <button
        className="flex items-center justify-between w-full mb-3"
        style={{
          fontSize: "var(--font-size-caption)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
        onClick={() => setOpen(!open)}
      >
        {title}
        <ChevronDown
          style={{
            width: 14,
            height: 14,
            color: "var(--color-text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const currentLanguage = searchParams.get("language") || "";
  const currentStars = searchParams.get("stars") || "";
  const currentForks = searchParams.get("forks") || "";
  const currentUpdated = searchParams.get("updated") || "";

  const hasFilters = currentLanguage || currentStars || currentForks || currentUpdated;

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs font-medium mb-4 transition-colors"
          style={{ color: "var(--color-primary)" }}
        >
          <X style={{ width: 12, height: 12 }} />
          清除筛选
        </button>
      )}

      <FilterSection title="编程语言">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => applyFilter("language", currentLanguage === lang ? "" : lang)}
            className="flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors"
            style={{
              height: 32,
              background: currentLanguage === lang ? "var(--color-bg-hover)" : "transparent",
              color: currentLanguage === lang ? "var(--color-primary)" : "var(--color-text-body)",
              fontWeight: currentLanguage === lang ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
            }}
          >
            {lang}
          </button>
        ))}
      </FilterSection>

      <FilterSection title="Stars">
        {STAR_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => applyFilter("stars", currentStars === range.value ? "" : range.value)}
            className="flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors"
            style={{
              height: 32,
              background: currentStars === range.value ? "var(--color-bg-hover)" : "transparent",
              color: currentStars === range.value ? "var(--color-primary)" : "var(--color-text-body)",
              fontWeight: currentStars === range.value ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
            }}
          >
            {range.label}
          </button>
        ))}
      </FilterSection>

      <FilterSection title="Forks">
        {FORK_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => applyFilter("forks", currentForks === range.value ? "" : range.value)}
            className="flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors"
            style={{
              height: 32,
              background: currentForks === range.value ? "var(--color-bg-hover)" : "transparent",
              color: currentForks === range.value ? "var(--color-primary)" : "var(--color-text-body)",
              fontWeight: currentForks === range.value ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
            }}
          >
            {range.label}
          </button>
        ))}
      </FilterSection>

      <FilterSection title="更新时间">
        {UPDATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => applyFilter("updated", currentUpdated === range.value ? "" : range.value)}
            className="flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors"
            style={{
              height: 32,
              background: currentUpdated === range.value ? "var(--color-bg-hover)" : "transparent",
              color: currentUpdated === range.value ? "var(--color-primary)" : "var(--color-text-body)",
              fontWeight: currentUpdated === range.value ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
            }}
          >
            {range.label}
          </button>
        ))}
      </FilterSection>
    </div>
  );
}
