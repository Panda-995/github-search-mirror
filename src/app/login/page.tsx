"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GitBranch, Sparkles, AlertCircle, Mail, Lock, UserPlus, LogIn } from "lucide-react";

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 rounded-lg p-3 text-xs"
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "var(--color-error)",
      }}
    >
      <AlertCircle style={{ width: 14, height: 14 }} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorMessages: Record<string, string> = {
    OAuthSignin: "GitHub OAuth 配置错误，请检查环境变量",
    OAuthCallback: "GitHub 授权回调失败",
    OAuthCreateAccount: "创建账户失败",
    EmailSignin: "邮箱登录失败",
    CredentialsSignin: "邮箱或密码不正确",
    Callback: "回调处理失败",
    Default: "登录过程中发生错误",
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("请输入邮箱和密码");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        mode: "login",
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.ok) {
        router.push(result.url ?? "/dashboard");
        router.refresh();
        return;
      }

      setFormError("邮箱或密码不正确");
    } catch {
      setFormError("登录请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setFormError("请输入用户名");
      return;
    }
    if (!trimmedEmail) {
      setFormError("请输入邮箱地址");
      return;
    }
    if (!password || !confirmPassword) {
      setFormError("请输入并确认密码");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }
    if (password.length < 8) {
      setFormError("密码至少需要 8 位");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        name: trimmedName,
        mode: "register",
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.ok) {
        router.push(result.url ?? "/dashboard");
        router.refresh();
        return;
      }

      setFormError("注册失败，请确认邮箱未注册且数据库服务可用");
    } catch {
      setFormError("注册请求失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setFormError(null);
  };

  const routeError =
    mode === "login" && error ? errorMessages[error] || errorMessages.Default : null;

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
              <p className="text-sm mt-1" style={{ color: "var(--color-text-body)" }}>
                {mode === "login" ? "选择登录方式" : "创建你的账号"}
              </p>
            </div>

            {/* Error message */}
            {routeError && (
              <div
                className="card flex items-start gap-2 p-3 mb-5"
                style={{
                  background: "#FEF2F2",
                  borderColor: "#FECACA",
                  color: "var(--color-error)",
                }}
              >
                <AlertCircle style={{ width: 14, height: 14 }} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs">{routeError}</p>
              </div>
            )}

            {/* GitHub Login */}
            <button
              type="button"
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
                type="button"
                onClick={() => switchMode("login")}
                className={`tab-pill flex-1 ${mode === "login" ? "active" : ""}`}
              >
                <LogIn style={{ width: 16, height: 16, marginRight: 4 }} />
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`tab-pill flex-1 ${mode === "register" ? "active" : ""}`}
              >
                <UserPlus style={{ width: 16, height: 16, marginRight: 4 }} />
                注册
              </button>
            </div>

            {/* Form */}
            {mode === "login" ? (
              <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
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
                <InlineError message={formError} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  <LogIn style={{ width: 16, height: 16 }} />
                  {isSubmitting ? "登录中..." : "登录"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
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
                <InlineError message={formError} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  <UserPlus style={{ width: 16, height: 16 }} />
                  {isSubmitting ? "注册中..." : "注册"}
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
