"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bookmark, Clock, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/dashboard/collections", label: "收藏夹", icon: Bookmark },
  { href: "/dashboard/history", label: "历史记录", icon: Clock },
  { href: "/dashboard/settings", label: "设置", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar-nav">
      <nav>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon style={{ width: 18, height: 18, transition: "transform 0.2s ease" }} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
