import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/permissions";

export interface HouseholdSession {
  userId: string;
  householdId: string;
  role: UserRole;
  name: string;
  email: string;
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Resolves the current server session, verifies the user is a member of their
 * household, and returns a typed session object.
 * Throws AuthError (401 or 403) on failure.
 */
export async function requireHouseholdRole(): Promise<HouseholdSession> {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id as string | undefined;
  const hid = session?.user?.householdId as string | undefined;

  if (!uid || !hid) throw new AuthError(401, "Unauthorized");

  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: hid, userId: uid } },
  });

  if (!membership) throw new AuthError(403, "Forbidden – not a household member");

  return {
    userId: uid,
    householdId: hid,
    role: membership.role as UserRole,
    name: session!.user.name ?? "",
    email: session!.user.email ?? "",
  };
}
