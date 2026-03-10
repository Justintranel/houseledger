import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";

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

  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        stripeSubscriptionId: true,
        subscriptionPlan: true,
        accountStatus: true,
      },
    });

    if (!household?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
    }

    if (household.subscriptionPlan === "annual") {
      return NextResponse.json({ error: "You are already on the annual plan." }, { status: 400 });
    }

    const validStatuses = ["ACTIVE", "TRIALING", "PAST_DUE"];
    if (!validStatuses.includes(household.accountStatus)) {
      return NextResponse.json({ error: "Your account is not eligible for an upgrade." }, { status: 400 });
    }

    // Retrieve the current subscription to get the item ID
    const sub = await stripe.subscriptions.retrieve(household.stripeSubscriptionId);
    const currentItem = sub.items.data[0];

    if (!currentItem) {
      return NextResponse.json({ error: "Could not find subscription item." }, { status: 500 });
    }

    const annualPriceId = PLANS.annual.priceId;
    if (annualPriceId === "price_placeholder_annual") {
      return NextResponse.json(
        { error: "Annual plan is not yet configured. Please contact support." },
        { status: 503 }
      );
    }

    // Switch to annual price — proration gives credit for unused monthly days
    const updated = await stripe.subscriptions.update(household.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: annualPriceId }],
      proration_behavior: "create_prorations",
    });

    // Persist the plan change in our DB
    await prisma.household.update({
      where: { id: householdId },
      data: {
        subscriptionPlan: "annual",
        stripeCurrentPeriodEnd: new Date(updated.current_period_end * 1000),
        // Keep accountStatus as-is — webhook will confirm
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/stripe/upgrade-to-annual]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
