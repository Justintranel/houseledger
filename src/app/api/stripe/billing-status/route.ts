import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const householdId = session.user.householdId;

  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        accountStatus: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        trialEndsAt: true,
        canceledAt: true,
      },
    });

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }

    return NextResponse.json(household);
  } catch (err) {
    console.error("[GET /api/stripe/billing-status]", err);
    return NextResponse.json({ error: "Failed to fetch billing status" }, { status: 500 });
  }
}
