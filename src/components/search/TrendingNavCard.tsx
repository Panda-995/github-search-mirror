import Link from "next/link";
import { TrendingUp, Star, Calendar } from "lucide-react";

interface TrendingNavCardProps {
  href: string;
  title: string;
  description: string;
  icon: "trending" | "star" | "calendar";
  iconBg: string;
  iconColor: string;
}

const ICONS = {
  trending: TrendingUp,
  star: Star,
  calendar: Calendar,
};

export function TrendingNavCard({
  href,
  title,
  description,
  icon,
  iconBg,
  iconColor,
}: TrendingNavCardProps) {
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-4 transition-all duration-200"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon style={{ width: 20, height: 20, color: iconColor }} />
      </div>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--surface-900)" }}>
          {title}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--surface-400)" }}>
          {description}
        </p>
      </div>
    </Link>
  );
}
