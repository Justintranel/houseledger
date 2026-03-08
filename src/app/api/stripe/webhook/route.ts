import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!customerEmail) break;

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: customerEmail.toLowerCase() },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: customerEmail.toLowerCase(),
              name: customerEmail.split("@")[0],
              passwordHash: "",
            },
          });
        }

        // Create or update Household
        let household = await prisma.household.findFirst({
          where: {
            members: { some: { userId: user.id, role: "OWNER" } },
          },
        });

        if (!household) {
          household = await prisma.household.create({
            data: {
              name: `${user.name ?? customerEmail}'s Household`,
              stripeCustomerId: customerId ?? undefined,
              stripeSubscriptionId: subscriptionId ?? undefined,
              subscriptionStatus: "active",
              onboardingCompleted: false,
            },
          });

          // Create OWNER membership
          await prisma.householdMember.create({
            data: {
              userId: user.id,
              householdId: household.id,
              role: "OWNER",
            },
          });

          // Create default "house-chat" channel
          const channel = await prisma.channel.create({
            data: {
              name: "house-chat",
              householdId: household.id,
            },
          });

          // Add owner to channel
          await prisma.channelMember.create({
            data: {
              channelId: channel.id,
              userId: user.id,
            },
          });
        } else {
          await prisma.household.update({
            where: { id: household.id },
            data: {
              stripeCustomerId: customerId ?? undefined,
              stripeSubscriptionId: subscriptionId ?? undefined,
              subscriptionStatus: "active",
            },
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await prisma.household.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await prisma.household.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "canceled" },
        });

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
