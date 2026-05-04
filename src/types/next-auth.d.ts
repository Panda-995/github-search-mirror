import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      githubId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }

  interface Profile {
    id?: string | number;
  }
}
