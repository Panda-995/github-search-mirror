"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { Search, X, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBoxProps {
  initialQuery?: string;
  size?: "default" | "large";
  maxWidth?: number | string;
}

const HOT_KEYWORDS = ["react", "vue", "python", "docker", "ai", "typescript", "nextjs", "rust"];
const QUERY_TIPS = [
  { label: "语言", value: "language:typescript" },
  { label: "星标", value: "stars:>1000" },
  { label: "主题", value: "topic:ai" },
  { label: "组织", value: "org:vercel" },
  { label: "最近更新", value: "pushed:>2026-01-01" },
];

export function SearchBox({ initialQuery = "", size = "default", maxWidth }: SearchBoxProps) {
  const router = useRouter();
  const [queryState, setQueryState] = useState(() => ({
    initialQuery,
    value: initialQuery,
  }));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  let query = queryState.value;

  if (queryState.initialQuery !== initialQuery) {
    query = initialQuery;
    setQueryState({ initialQuery, value: initialQuery });
  }

  const setQuery = useCallback(
    (value: string) => {
      setQueryState({ initialQuery, value });
    },
    [initialQuery]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const trimmed = query.trim();
      if (!trimmed) {
        event.preventDefault();
        return;
      }
      setIsFocused(false);
    },
    [query]
  );

  const goToKeyword = useCallback(
    (keyword: string) => {
      setQuery(keyword);
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
    },
    [router, setQuery]
  );

  const insertQualifier = useCallback(
    (value: string) => {
      const next = query.trim() ? `${query.trim()} ${value}` : value;
      setQuery(next);
      inputRef.current?.focus();
    },
    [query, setQuery]
  );

  const clearQuery = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [setQuery]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "/" && !isTyping && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const isLarge = size === "large";

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        maxWidth: maxWidth ?? (isLarge ? 768 : 480),
        zIndex: isFocused ? "var(--z-popover)" : "auto",
      }}
    >
      {/* Search Input */}
      <Form
        action="/search"
        onSubmit={handleSubmit}
        className="relative z-20 flex items-center transition-all"
        style={{
          height: isLarge ? 64 : 48,
          background: "var(--color-bg-card)",
          borderRadius: isLarge ? "var(--radius-2xl)" : "var(--radius-xl)",
          boxShadow: isFocused
            ? "var(--shadow-hover)"
            : isLarge
              ? "var(--shadow-hover)"
              : "var(--shadow-sm)",
          transition: "all var(--duration-fast) var(--ease-out)",
          outline: isFocused ? "4px solid rgba(79, 70, 229, 0.15)" : "none",
        }}
      >
        {/* Left Search Button */}
        <button
          type="submit"
          aria-label="搜索"
          className="absolute left-4 flex-shrink-0"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isLarge ? 22 : 18,
            height: isLarge ? 22 : 18,
            color: isFocused ? "var(--color-primary)" : "var(--color-text-muted)",
            transition: "color var(--duration-fast) var(--ease-out)",
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Search style={{ width: "100%", height: "100%" }} />
        </button>

        <input
          ref={inputRef}
          type="text"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          enterKeyHint="search"
          placeholder="搜索 GitHub 项目..."
          className="w-full h-full bg-transparent outline-none"
          style={{
            paddingLeft: isLarge ? 52 : 44,
            paddingRight: query ? 44 : isLarge ? 100 : 80,
            color: "var(--color-text-heading)",
            fontSize: isLarge ? 18 : 15,
            fontFamily: "var(--font-family-base)",
            caretColor: "var(--color-primary)",
          }}
        />

        {/* Right Clear Button or Keyboard Shortcut */}
        {!query && (
          <div className="absolute right-4 flex items-center gap-1 pointer-events-none">
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5"
              style={{
                background: "var(--color-bg-page)",
                border: "1px solid var(--color-border)",
                borderBottomWidth: 2,
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-caption)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              <Command style={{ width: 12, height: 12 }} />K
            </kbd>
          </div>
        )}
        {query && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearQuery}
            aria-label="清空搜索"
            className="icon-btn absolute right-2"
            style={{ width: 32, height: 32 }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </Form>

      {/* Dropdown - Hot Search Tags and Syntax Hints */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 overflow-hidden"
            style={{
              zIndex: "var(--z-popover)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div className="px-4 py-3">
              {!query && (
                <>
                  <p
                    className="uppercase tracking-wider mb-3"
                    style={{
                      fontSize: "var(--font-size-caption)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    热门搜索
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HOT_KEYWORDS.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => goToKeyword(keyword)}
                        className="tag"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p
                className={`${query ? "" : "mt-4"} uppercase tracking-wider mb-3`}
                style={{
                  fontSize: "var(--font-size-caption)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-muted)",
                }}
              >
                搜索语法
              </p>
              <div className="flex flex-wrap gap-2">
                {QUERY_TIPS.map((tip) => (
                  <button
                    key={tip.value}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertQualifier(tip.value)}
                    className="tag"
                    title={tip.value}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
