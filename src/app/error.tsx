"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl mb-4" style={{ background: "#fef2f2" }}>
          <AlertCircle style={{ width: 28, height: 28, color: "#dc2626" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--surface-900)" }}>
          出错了
        </h2>
        <p className="text-sm mb-6 text-center max-w-sm" style={{ color: "var(--surface-500)" }}>
          {error.message || "发生了意外错误，请稍后重试"}
        </p>
        <button
          onClick={reset}
          className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          style={{ background: "var(--accent-indigo)", color: "white" }}
        >
          重试
        </button>
      </div>
    </div>
  );
}
