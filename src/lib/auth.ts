import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { createEmailUser, getUserById, verifyEmailCredentials } from "@/server/user.actions";
import { checkRateLimitAsync } from "@/lib/rate-limit";

interface ExtendedSession {
  user: {
    id?: string;
    role?: "USER" | "ADMIN";
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface ExtendedToken {
  sub?: string;
  role?: "USER" | "ADMIN";
}

type CredentialsMode = "login" | "register";
type HeaderRecord = Record<string, string | string[] | undefined>;

interface CredentialsRequest {
  headers?: Headers | HeaderRecord;
}

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LOGIN_EMAIL_LIMIT = 10;
const AUTH_REGISTER_EMAIL_LIMIT = 5;
const AUTH_LOGIN_IP_LIMIT = 50;
const AUTH_REGISTER_IP_LIMIT = 20;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getHeaderValue(request: CredentialsRequest | undefined, name: string) {
  const headers = request?.headers;
  if (!headers) return undefined;

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(request: CredentialsRequest | undefined) {
  const forwardedFor = getHeaderValue(request, "x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim() || "unknown";
  return getHeaderValue(request, "x-real-ip") ?? "unknown";
}

async function isCredentialsRateLimited(
  email: string,
  mode: CredentialsMode,
  request: CredentialsRequest | undefined
) {
  const emailLimit = mode === "register" ? AUTH_REGISTER_EMAIL_LIMIT : AUTH_LOGIN_EMAIL_LIMIT;
  const ipLimit = mode === "register" ? AUTH_REGISTER_IP_LIMIT : AUTH_LOGIN_IP_LIMIT;
  const [emailBucket, ipBucket] = await Promise.all([
    checkRateLimitAsync(`auth:${mode}:email:${email}`, {
      limit: emailLimit,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    }),
    checkRateLimitAsync(`auth:${mode}:ip:${getClientIp(request)}`, {
      limit: ipLimit,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    }),
  ]);

  return !emailBucket.allowed || !ipBucket.allowed;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "邮箱登录",
      credentials: {
        email: { label: "邮箱", type: "email", placeholder: "your@email.com" },
        password: { label: "密码", type: "password", placeholder: "输入密码" },
        name: { label: "用户名", type: "text" },
        mode: { label: "模式", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const email = normalizeEmail(credentials.email);
          const password = credentials.password;
          const mode: CredentialsMode = credentials.mode === "register" ? "register" : "login";
          if (password.length < 8) return null;
          if (await isCredentialsRateLimited(email, mode, request as CredentialsRequest)) {
            return null;
          }

          const dbUser =
            mode === "register"
              ? await createEmailUser({
                  email,
                  password,
                  name: credentials.name,
                })
              : await verifyEmailCredentials(email, password);

          if (!dbUser) return null;

          return {
            id: dbUser.id,
            name: dbUser.name ?? email.split("@")[0],
            email: dbUser.email,
            image: null,
            role: dbUser.role ?? "USER",
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const role = (user as typeof user & { role?: "USER" | "ADMIN" }).role;
        if (role) token.role = role;
      }
      if (!token.role && token.sub) {
        const dbUser = await getUserById(token.sub);
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as unknown as ExtendedSession;
      const extendedToken = token as unknown as ExtendedToken;
      extendedSession.user.id = extendedToken.sub ?? "";
      extendedSession.user.role = extendedToken.role ?? "USER";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
