import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBillingCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "OWNER") {
    return NextResponse.json({ error: "Only household owners can manage billing" }, { status: 403 });
  }

  const householdId = session.user.householdId;
  const userId = (session.user as any).id as string;

  try {
    // Check if already actively subscribed
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { stripeSubscriptionId: true, subscriptionStatus: true },
    });

    if (
      household?.stripeSubscriptionId &&
      household.subscriptionStatus === "active"
    ) {
      return NextResponse.json(
        { error: "Household already has an active subscription" },
        { status: 409 }
      );
    }

    // Get owner email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

    const checkoutSession = await createBillingCheckoutSession({
      email: user.email,
      householdId,
      successUrl: `${appUrl}/dashboard?trial=started`,
      cancelUrl: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[POST /api/stripe/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
