import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) { console.log("[auth] user not found:", credentials.email); return null; }
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) { console.log("[auth] wrong password for:", credentials.email); return null; }

        console.log("[auth] login:", credentials.email, "isSuperAdmin:", user.isSuperAdmin);

        // Super Admin: no household membership needed
        if (user.isSuperAdmin) {
          console.log("[auth] returning super admin session");
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: null,
            householdId: null,
            onboardingCompleted: true, // bypass onboarding redirect
            isSuperAdmin: true,
          };
        }

        // Find the user's household membership to get role
        const membership = await prisma.householdMember.findFirst({
          where: { userId: user.id },
          include: { household: true },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: membership?.role ?? null,
          householdId: membership?.householdId ?? null,
          onboardingCompleted: membership?.household.onboardingCompleted ?? false,
          isSuperAdmin: false,
        };
      },
    }),
    // Future OAuth providers go here — structure is already in place
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // Initial sign-in: populate token from the user object
      if (user) {
        console.log("[jwt] user object received:", JSON.stringify({ id: user.id, email: user.email, isSuperAdmin: user.isSuperAdmin, onboardingCompleted: user.onboardingCompleted }));
        token.id = user.id;
        token.role = user.role;
        token.householdId = user.householdId;
        token.onboardingCompleted = user.onboardingCompleted;
        token.isSuperAdmin = user.isSuperAdmin ?? false;
        console.log("[jwt] token.isSuperAdmin set to:", token.isSuperAdmin);
      }

      // Backfill isSuperAdmin for sessions created before this field existed.
      // Only fires once per stale token (when the field is completely absent).
      if (token.id && token.isSuperAdmin === undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuperAdmin: true },
        });
        if (!dbUser) {
          // User no longer exists in DB (e.g. account was recreated).
          // Mark the token invalid so the middleware forces a new login.
          token.invalid = true;
          return token;
        }
        token.isSuperAdmin = dbUser.isSuperAdmin ?? false;
        // Super admins never need onboarding
        if (token.isSuperAdmin) token.onboardingCompleted = true;
      }

      // Allow the onboarding page to mark the JWT as complete without
      // requiring a sign-out / sign-in cycle
      if (trigger === "update" && session?.onboardingCompleted !== undefined) {
        token.onboardingCompleted = session.onboardingCompleted;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.householdId = token.householdId as string;
      session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      session.user.isSuperAdmin = (token.isSuperAdmin as boolean) ?? false;
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
};
