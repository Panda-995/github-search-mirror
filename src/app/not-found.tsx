import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div
        className="flex flex-col items-center justify-center p-8 rounded-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl mb-4" style={{ background: "var(--surface-100)" }}>
          <Search style={{ width: 28, height: 28, color: "var(--surface-400)" }} />
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--surface-900)" }}>
          404
        </h1>
        <p className="text-base mb-6" style={{ color: "var(--surface-500)" }}>
          页面未找到
        </p>
        <Link
          href="/"
          className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          style={{ background: "var(--accent-indigo)", color: "white" }}
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
