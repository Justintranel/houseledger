import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { sendRecruitRequestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "OWNER") {
    return NextResponse.json({ error: "Only household owners can use this feature" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { responses, ownerName, ownerEmail } = body as {
    responses: Record<string, string>;
    ownerName: string;
    ownerEmail: string;
  };

  if (!responses || typeof responses !== "object") {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  try {
    // Email form responses to the team immediately
    await sendRecruitRequestEmail(ownerEmail, ownerName, responses).catch((err) =>
      console.error("[recruit-checkout] email error:", err),
    );

    // Create a $5,000 one-time Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: ownerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500000, // $5,000 in cents
            product_data: {
              name: "Recruit For Me — House Manager Placement",
              description:
                "Done-for-you house manager sourcing, screening, background check, and placement. 4–6 week process with a satisfaction guarantee.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/hire/recruit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/hire/recruit`,
      metadata: {
        ownerEmail,
        ownerName,
        service: "recruit-for-me",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[POST /api/stripe/recruit-checkout]", err);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}
