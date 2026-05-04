import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user public_repo read:org",
        },
      },
    }),
    // Email/Password Login
    CredentialsProvider({
      id: "credentials",
      name: "邮箱登录",
      credentials: {
        email: { label: "邮箱", type: "email", placeholder: "your@email.com" },
        password: { label: "密码", type: "password", placeholder: "输入密码" },
      },
      async authorize(credentials) {
        // TODO: Implement actual email/password verification against database
        // For now, allow any email/password combination for demo purposes
        if (!credentials?.email || !credentials?.password) return null;
        
        // In production, verify against database here
        return {
          id: `email-${credentials.email}`,
          name: credentials.email.split("@")[0],
          email: credentials.email,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId = String((profile as any).id ?? "");
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub ?? "";
      (session.user as any).githubId = token.githubId as string;
      (session as any).accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
