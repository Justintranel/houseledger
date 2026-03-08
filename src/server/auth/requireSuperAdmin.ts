import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class AdminAuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export interface SuperAdminSession {
  userId: string;
  name: string;
  email: string;
}

/**
 * Require that the current session is a Super Admin.
 * Throws AdminAuthError(401) if not authenticated.
 * Throws AdminAuthError(403) if authenticated but not super admin.
 */
export async function requireSuperAdmin(): Promise<SuperAdminSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AdminAuthError(401, "Unauthorized");
  }

  if (!(session.user as any).isSuperAdmin) {
    throw new AdminAuthError(403, "Forbidden — Super Admin only");
  }

  return {
    userId: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}
