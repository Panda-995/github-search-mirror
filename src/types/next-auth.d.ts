import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      githubId: string;
      role: "USER" | "ADMIN";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface Profile {
    id?: string | number;
  }
}
