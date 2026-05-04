"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn-danger"
    >
      <LogOut style={{ width: 16, height: 16 }} />
      退出登录
    </button>
  );
}
