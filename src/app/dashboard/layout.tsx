import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getAllFlags } from "@/lib/flags";
import Sidebar from "@/components/portal/Sidebar";
import SubscriptionBanner from "@/components/portal/SubscriptionBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Super Admin has no household — send them to the admin portal
  if ((session.user as any).isSuperAdmin) redirect("/admin");

  const householdId = session.user.householdId!;
  const role = (session.user as any).role as string;

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      name: true,
      accountStatus: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
  });

  const flags = await getAllFlags(householdId);

  // ── Subscription gate (OWNER only) ─────────────────────────────────────────
  // Managers and family members inherit the owner's subscription status.
  // Only the OWNER needs to act on billing issues.
  if (role === "OWNER" && household) {
    const now = new Date();
    const { accountStatus, stripeSubscriptionId, trialEndsAt } = household;

    const isCanceled = accountStatus === "CANCELED" || accountStatus === "SUSPENDED";
    const trialExpired =
      !stripeSubscriptionId && (!trialEndsAt || trialEndsAt < now);

    // Read the current pathname via Next.js headers (set by middleware)
    const headersList = headers();
    const pathname = headersList.get("x-invoke-path") ?? "";
    const onBillingPage = pathname.startsWith("/dashboard/billing") || pathname === "";

    if ((isCanceled || trialExpired) && !onBillingPage) {
      redirect("/dashboard/billing");
    }
  }

  // ── Determine which banner to show ─────────────────────────────────────────
  let bannerType: "trial" | "past_due" | null = null;
  let trialDaysLeft = 0;

  if (household && role === "OWNER") {
    const now = new Date();
    const { accountStatus, stripeSubscriptionId, trialEndsAt } = household;

    if (
      accountStatus === "TRIALING" &&
      !stripeSubscriptionId &&
      trialEndsAt &&
      trialEndsAt > now
    ) {
      bannerType = "trial";
      trialDaysLeft = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else if (accountStatus === "PAST_DUE") {
      bannerType = "past_due";
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} householdName={household?.name || "My Household"} flags={flags} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {bannerType && (
          <SubscriptionBanner type={bannerType} daysLeft={trialDaysLeft} />
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
