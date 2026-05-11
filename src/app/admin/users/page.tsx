import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Shield, User } from "lucide-react";


export default async function UsersPage() {
  let allUsers: (typeof users.$inferSelect)[] = [];

  try {
    allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  } catch {
    // Database not available, show empty state
    allUsers = [];
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--color-text-heading)" }}>
        用户管理
      </h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-page)",
              }}
            >
              <th
                className="px-4 py-3 text-left"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                用户
              </th>
              <th
                className="px-4 py-3 text-left"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                角色
              </th>
              <th
                className="px-4 py-3 text-left"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                注册时间
              </th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name ?? ""}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: "var(--color-bg-hover)" }}
                      >
                        <User style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium" style={{ color: "var(--color-text-heading)" }}>
                        {user.name ?? "未命名"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 badge"
                    style={{
                      background: user.role === "ADMIN" ? "#F3E8FF" : "var(--color-bg-hover)",
                      color: user.role === "ADMIN" ? "#9333EA" : "var(--color-text-muted)",
                    }}
                  >
                    {user.role === "ADMIN" && <Shield style={{ width: 12, height: 12 }} />}
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <User
              style={{ width: 32, height: 32, color: "var(--color-text-muted)" }}
              className="mb-3"
            />
            <p style={{ color: "var(--color-text-muted)" }}>暂无用户</p>
          </div>
        )}
      </div>
    </div>
  );
}
