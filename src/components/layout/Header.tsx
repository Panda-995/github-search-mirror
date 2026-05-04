"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, TrendingUp, User, LayoutDashboard, Command, LogOut } from "lucide-react";
import Image from "next/image";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const navItems = [
    { href: "/search", label: "搜索", icon: Search },
    { href: "/trending", label: "趋势", icon: TrendingUp },
  ];

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <header
      className="sticky top-0"
      style={{
        zIndex: "var(--z-navbar)",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="page-container">
        <div className="flex items-center justify-between" style={{ height: 64 }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="GitMirror"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span
              className="hidden sm:block"
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-heading)",
              }}
            >
              GitMirror
            </span>
          </Link>

          {/* Center Search - max 480px */}
          <div className="hidden md:flex flex-1 justify-center mx-8" style={{ maxWidth: 480 }}>
            <div
              className="flex items-center w-full"
              style={{
                height: 40,
                background: "var(--color-bg-page)",
                borderRadius: "var(--radius-xl)",
                padding: "0 12px",
                gap: 8,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Search style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索 GitHub 项目..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--color-text-heading)" }}
              />
              <kbd
                className="hidden lg:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderBottomWidth: 2,
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-caption)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                <Command style={{ width: 10, height: 10 }} />
                K
              </kbd>
            </div>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-1">
            {/* Desktop Nav Tabs with underline */}
            <nav className="hidden md:flex items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="tab-underline"
                    style={{
                      color: isActive ? "var(--color-primary)" : "var(--color-text-body)",
                      borderBottomColor: isActive ? "var(--color-primary)" : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Dashboard link - only show when authenticated */}
            {isAuthenticated && (
              <>
                <div className="hidden md:block w-px h-5 mx-2" style={{ background: "var(--color-border)" }} />
                <Link
                  href="/dashboard"
                  className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                  style={{
                    fontSize: "var(--font-size-body)",
                    fontWeight: "var(--font-weight-medium)",
                    color: pathname.startsWith("/dashboard") ? "var(--color-primary)" : "var(--color-text-body)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LayoutDashboard style={{ width: 16, height: 16 }} />
                  后台
                </Link>
              </>
            )}

            {/* Login / User */}
            <div className="hidden md:block w-px h-5 mx-2" style={{ background: "var(--color-border)" }} />
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "用户"}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      fontSize: "var(--font-size-caption)",
                      fontWeight: "var(--font-weight-bold)",
                    }}
                  >
                    {(session?.user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
                style={{
                  fontSize: "var(--font-size-body)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-body)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <User style={{ width: 16, height: 16 }} />
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
