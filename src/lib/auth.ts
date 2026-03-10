import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

// ─── Startup guard ────────────────────────────────────────────────────────────
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET is not set. Set it in .env.local before starting the server."
  );
}

// ─── In-memory login rate limiter ─────────────────────────────────────────────
// 5 attempts per email per 15-minute sliding window.
// For multi-instance production deployments, back this with Redis instead.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const _loginAttempts = new Map<string, { count: number; windowStart: number }>();

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = _loginAttempts.get(key);

  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    _loginAttempts.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

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

        // Rate-limit by email before touching the database
        if (!checkLoginRateLimit(credentials.email)) {
          throw new Error(
            "Too many login attempts. Please wait 15 minutes and try again."
          );
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });
          if (!user) return null;
          const ok = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!ok) return null;

          // Super Admin: no household membership needed
          if (user.isSuperAdmin) {
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

          // Find the user's household memberships.
          // If they have multiple (e.g. accidentally added own email as manager during
          // onboarding), always prefer the OWNER role to prevent access loss.
          // NOTE: Only select the exact fields auth needs — never include: { household: true }
          // because new Household columns added during development may not yet exist in the
          // production DB, which would crash this query and lock out every user.
          const memberships = await prisma.householdMember.findMany({
            where: { userId: user.id },
            select: {
              role: true,
              householdId: true,
              household: { select: { onboardingCompleted: true } },
            },
            orderBy: { joinedAt: "asc" },
          });

          // Pick OWNER membership first, then FAMILY, then MANAGER
          const rolePriority: Record<string, number> = { OWNER: 0, FAMILY: 1, MANAGER: 2 };
          const membership = memberships.sort(
            (a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99)
          )[0] ?? null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: membership?.role ?? null,
            householdId: membership?.householdId ?? null,
            onboardingCompleted: membership?.household.onboardingCompleted ?? false,
            isSuperAdmin: false,
          };
        } catch (err) {
          // A DB error (e.g. missing column from a pending migration) must never
          // silently block all logins. Log it loudly so it shows up in Railway logs.
          console.error("[auth] authorize() threw — check DB schema sync:", err);
          return null;
        }
      },
    }),
    // Future OAuth providers go here — structure is already in place
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // Initial sign-in: populate token from the user object
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.householdId = user.householdId;
        token.onboardingCompleted = user.onboardingCompleted;
        token.isSuperAdmin = user.isSuperAdmin ?? false;
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

      // Allow the onboarding page to update the JWT without a sign-out/sign-in cycle.
      // NOTE: `role` cannot be set directly from the client (that would allow privilege
      // escalation). Instead, the client sends `refreshRole: true` which triggers a
      // DB re-read here — the role comes from the database, not the client.
      if (trigger === "update") {
        if (session?.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session?.householdId !== undefined) {
          token.householdId = session.householdId;
        }
        // Safe role refresh: client signals "please re-read my role from DB".
        // The actual role value always comes from the database — never from the client.
        if (session?.refreshRole === true && token.id) {
          const memberships = await prisma.householdMember.findMany({
            where: { userId: token.id as string },
            select: {
              role: true,
              householdId: true,
              household: { select: { onboardingCompleted: true } },
            },
            orderBy: { joinedAt: "asc" },
          });
          const rolePriority: Record<string, number> = { OWNER: 0, FAMILY: 1, MANAGER: 2 };
          const best = memberships.sort(
            (a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99)
          )[0];
          if (best) {
            token.role = best.role;
            token.householdId = best.householdId;
            token.onboardingCompleted = best.household.onboardingCompleted;
          }
        }
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
