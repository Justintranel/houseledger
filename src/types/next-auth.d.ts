import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string | null;
    householdId: string | null;
    onboardingCompleted: boolean;
    isSuperAdmin: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: string | null;
      householdId: string | null;
      onboardingCompleted: boolean;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string | null;
    householdId: string | null;
    onboardingCompleted: boolean;
    isSuperAdmin: boolean;
  }
}
