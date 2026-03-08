import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Onboarding is ONLY for first-time household owners.
 * Super Admins and already-onboarded users are redirected away immediately.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Not logged in
  if (!session?.user) redirect("/login");

  // Super Admin never needs onboarding — straight to admin portal
  if ((session.user as any).isSuperAdmin) redirect("/admin");

  // Already completed onboarding — go to dashboard
  if (session.user.onboardingCompleted) redirect("/dashboard");

  return <>{children}</>;
}
