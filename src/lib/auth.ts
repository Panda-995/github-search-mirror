import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, Profile } from "next-auth";
import {
  createEmailUser,
  createOrUpdateUser,
  getUserById,
  verifyEmailCredentials,
} from "@/server/user.actions";

interface GitHubProfile extends Profile {
  id?: string | number;
  email?: string;
  name?: string;
  avatar_url?: string;
}

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
  githubId?: string;
  role?: "USER" | "ADMIN";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getVerifiedGitHubEmail(accessToken?: string) {
  if (!accessToken) return { email: null, verified: false };

  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "GitMirror/1.0",
      },
    });

    if (!response.ok) return { email: null, verified: false };

    const emails = (await response.json()) as {
      email?: string;
      primary?: boolean;
      verified?: boolean;
    }[];
    const primary = emails.find((item) => item.primary && item.verified);
    const verified = primary ?? emails.find((item) => item.verified);

    return {
      email: verified?.email ? normalizeEmail(verified.email) : null,
      verified: Boolean(verified?.email),
    };
  } catch {
    return { email: null, verified: false };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        try {
          const githubProfile = profile as GitHubProfile;
          const verifiedEmail = await getVerifiedGitHubEmail(account.access_token);
          const email = verifiedEmail.email ?? githubProfile.email ?? user.email ?? null;
          const userId = await createOrUpdateUser({
            githubId: String(githubProfile.id ?? ""),
            email,
            emailVerified: verifiedEmail.verified,
            name: githubProfile.name ?? user.name ?? null,
            avatar: githubProfile.avatar_url ?? user.image ?? null,
            githubToken: account.access_token ?? null,
          });
          user.id = userId;
          const dbUser = await getUserById(userId);
          (user as typeof user & { role?: "USER" | "ADMIN" }).role = dbUser?.role ?? "USER";
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        const githubProfile = profile as GitHubProfile;
        token.githubId = String(githubProfile.id ?? "");
      }
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
      extendedSession.user.githubId = extendedToken.githubId ?? "";
      extendedSession.user.role = extendedToken.role ?? "USER";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
