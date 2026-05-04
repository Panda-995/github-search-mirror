"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GitBranch, Sparkles, AlertCircle, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const errorMessages: Record<string, string> = {
    OAuthSignin: "GitHub OAuth 配置错误，请检查环境变量",
    OAuthCallback: "GitHub 授权回调失败",
    OAuthCreateAccount: "创建账户失败",
    EmailSignin: "邮箱登录失败",
    Callback: "回调处理失败",
    Default: "登录过程中发生错误",
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="card p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-4"
                style={{ background: "var(--color-primary-light)" }}
              >
                <Sparkles style={{ width: 24, height: 24, color: "var(--color-primary)" }} />
              </div>
              <h1
                className="text-xl"
                style={{
                  color: "var(--color-text-heading)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                {mode === "login" ? "登录到 GitMirror" : "注册 GitMirror 账号"}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-body)" }}
              >
                {mode === "login" ? "选择登录方式" : "创建你的账号"}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="card flex items-start gap-2 p-3 mb-5"
                style={{
                  background: "#FEF2F2",
                  borderColor: "#FECACA",
                  color: "var(--color-error)",
                }}
              >
                <AlertCircle style={{ width: 14, height: 14 }} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  {errorMessages[error] || errorMessages.Default}
                </p>
              </div>
            )}

            {/* GitHub Login */}
            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="btn-primary w-full justify-center"
              style={{ marginBottom: 24 }}
            >
              <GitBranch style={{ width: 18, height: 18 }} />
              使用 GitHub 登录
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                或使用邮箱
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            </div>

            {/* Mode Toggle */}
            <div className="tab-pill-container w-full mb-5">
              <button
                onClick={() => setMode("login")}
                className={`tab-pill flex-1 ${mode === "login" ? "active" : ""}`}
              >
                <LogIn style={{ width: 16, height: 16, marginRight: 4 }} />
                登录
              </button>
              <button
                onClick={() => setMode("register")}
                className={`tab-pill flex-1 ${mode === "register" ? "active" : ""}`}
              >
                <UserPlus style={{ width: 16, height: 16, marginRight: 4 }} />
                注册
              </button>
            </div>

            {/* Form */}
            {mode === "login" ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    邮箱地址
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    密码
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center">
                  <LogIn style={{ width: 16, height: 16 }} />
                  登录
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    用户名
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="你的用户名"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    邮箱地址
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    密码
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="设置密码"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-xs font-medium block mb-1.5"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      required
                      className="input w-full"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center">
                  <UserPlus style={{ width: 16, height: 16 }} />
                  注册
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
