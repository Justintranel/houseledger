import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

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
      select: { stripeCustomerId: true },
    });

    if (!household?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: household.stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[POST /api/stripe/portal]", err);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}
