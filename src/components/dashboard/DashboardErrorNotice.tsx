import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

interface DashboardErrorNoticeProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export function DashboardErrorNotice({
  title,
  message,
  actionHref,
  actionLabel = "重试",
}: DashboardErrorNoticeProps) {
  return (
    <div
      className="card p-5"
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 flex-shrink-0"
          style={{ width: 18, height: 18, color: "var(--color-error)" }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-text-body)" }}>
            {message}
          </p>
          {actionHref && (
            <Link href={actionHref} className="btn-secondary mt-3 text-xs">
              <RefreshCw style={{ width: 13, height: 13 }} />
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
