import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-bg-card)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div className="page-container py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="GitMirror"
              width={24}
              height={24}
              className="rounded"
            />
            <span
              className="text-sm"
              style={{
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-heading)",
              }}
            >
              GitMirror
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/search"
              className="text-sm transition-colors"
              style={{ color: "var(--color-text-body)" }}
            >
              搜索
            </Link>
            <Link
              href="/trending"
              className="text-sm transition-colors"
              style={{ color: "var(--color-text-body)" }}
            >
              趋势
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors"
              style={{ color: "var(--color-text-body)" }}
            >
              GitHub
            </a>
          </div>

          <p
            className="text-xs text-center sm:text-right"
            style={{ color: "var(--color-text-muted)" }}
          >
            GitMirror - GitHub 搜索镜像站
          </p>
        </div>
      </div>
    </footer>
  );
}
