import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Invalid email"),
  planId: z.string().min(1, "Plan ID is required"),
  promoCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, planId, promoCode } = parsed.data;

    const baseUrl =
      process.env.NEXTAUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

    const session = await createCheckoutSession({
      email,
      planId,
      promoCode,
      successUrl: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/signup`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[POST /api/stripe/create-checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
