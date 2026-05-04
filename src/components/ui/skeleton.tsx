import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={{ background: "var(--surface-200)" }}
      {...props}
    />
  )
}

export { Skeleton }
