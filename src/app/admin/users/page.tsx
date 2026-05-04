import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Shield, User } from "lucide-react";

export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted">
              <th className="px-4 py-3 text-left">用户</th>
              <th className="px-4 py-3 text-left">GitHub ID</th>
              <th className="px-4 py-3 text-left">角色</th>
              <th className="px-4 py-3 text-left">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name ?? ""}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{user.name ?? "未命名"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.githubId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.role === "ADMIN" && <Shield className="h-3 w-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("zh-CN")
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
