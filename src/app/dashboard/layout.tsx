import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getAllFlags } from "@/lib/flags";
import Sidebar from "@/components/portal/Sidebar";
import SubscriptionBanner from "@/components/portal/SubscriptionBanner";
import PaywallOverlay from "@/components/portal/PaywallOverlay";
import FeatureTour from "@/components/portal/FeatureTour";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Super Admin has no household — send them to the admin portal
  if ((session.user as any).isSuperAdmin) redirect("/admin");

  const householdId = session.user.householdId;
  const role = (session.user as any).role as string;

  // No household yet — user registered but never completed onboarding (e.g. auto sign-in
  // failed after signup). Querying Prisma with a null id crashes the server; send them
  // to onboarding instead so they can finish setting up their account.
  if (!householdId) redirect("/onboarding");

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      name: true,
      accountStatus: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
      communityLabel: true,
      communityUrl: true,
    },
  });

  const flags = await getAllFlags(householdId);

  // ── Subscription gate (OWNER only) ─────────────────────────────────────────
  // Managers and family members inherit the owner's subscription status.
  // Only the OWNER needs to act on billing issues.
  if (role === "OWNER" && household) {
    const { stripeSubscriptionId } = household;

    // No Stripe subscription means CC has never been collected — hard redirect to billing
    const needsPayment = !stripeSubscriptionId;

    // Read the current pathname injected by middleware (x-pathname header).
    // If somehow missing, default to "/dashboard" so the gate fires rather than bypasses.
    const headersList = headers();
    const pathname = headersList.get("x-pathname") ?? "/dashboard";
    const onBillingPage = pathname.startsWith("/dashboard/billing");

    if (needsPayment && !onBillingPage) {
      redirect("/dashboard/billing");
    }
    // CANCELED/SUSPENDED accounts stay in the dashboard but see the PaywallOverlay
  }

  // ── Determine which banner to show ─────────────────────────────────────────
  let bannerType: "trial" | "past_due" | null = null;
  let trialDaysLeft = 0;

  if (household && role === "OWNER") {
    const now = new Date();
    const { accountStatus, stripeSubscriptionId, trialEndsAt } = household;

    if (
      accountStatus === "TRIALING" &&
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

  const accountStatus = household?.accountStatus ?? "TRIALING";
  const isPaywalled =
    role === "OWNER" &&
    (accountStatus === "CANCELED" || accountStatus === "SUSPENDED");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        role={role}
        householdName={household?.name || "My Household"}
        flags={flags}
        communityLabel={household?.communityLabel ?? undefined}
        communityUrl={household?.communityUrl ?? undefined}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {bannerType && (
          <SubscriptionBanner type={bannerType} daysLeft={trialDaysLeft} />
        )}
        <main className="relative flex-1 overflow-y-auto">
          {children}
          {isPaywalled && <PaywallOverlay accountStatus={accountStatus} />}
        </main>
        <FeatureTour role={role} />
      </div>
    </div>
  );
}
