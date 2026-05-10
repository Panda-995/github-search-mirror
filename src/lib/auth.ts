import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { createEmailUser, getUserById, verifyEmailCredentials } from "@/server/user.actions";

interface ExtendedSession {
  user: {
    id?: string;
    githubId?: string;
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const email = normalizeEmail(credentials.email);
          const password = credentials.password;
          if (password.length < 8) return null;

          const dbUser =
            credentials.mode === "register"
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
      extendedSession.user.githubId = "";
      extendedSession.user.role = extendedToken.role ?? "USER";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
