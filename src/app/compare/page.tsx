import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CompareBoard } from "@/components/compare/CompareBoard";
import { GitCompareArrows } from "lucide-react";

export default function ComparePage() {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="page-container py-6 sm:py-8">
          <div className="mb-6 flex items-center gap-2 px-2 sm:px-0">
            <GitCompareArrows style={{ width: 20, height: 20, color: "var(--color-text-muted)" }} />
            <div>
              <h1
                className="text-base sm:text-lg"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                仓库对比
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                从维护状态、社区规模、许可协议和风险提示快速做技术选型。
              </p>
            </div>
          </div>
          <CompareBoard />
        </div>
      </main>
      <Footer />
    </>
  );
}
