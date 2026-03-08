import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Map Stripe subscription status → our AccountStatus enum value */
function mapStripeStatus(stripeStatus: string): string {
  const map: Record<string, string> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    unpaid: "UNPAID",
    canceled: "CANCELED",
    paused: "SUSPENDED",
    incomplete: "TRIALING",
    incomplete_expired: "CANCELED",
  };
  return map[stripeStatus] ?? "ACTIVE";
}

export async function POST(req: NextRequest) {
  // CRITICAL: Use raw body text — do NOT call req.json()
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[stripe/webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed (trial starts, card captured) ───────────────────
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        // householdId passed via metadata and client_reference_id
        const householdId =
          checkoutSession.metadata?.householdId ??
          checkoutSession.client_reference_id;

        if (!householdId) {
          console.error("[webhook] checkout.session.completed: no householdId in metadata");
          break;
        }

        const subscriptionId = checkoutSession.subscription as string;
        const customerId = checkoutSession.customer as string;

        if (!subscriptionId || !customerId) {
          console.error("[webhook] checkout.session.completed: missing subscriptionId or customerId");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.household.update({
          where: { id: householdId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: subscription.status,
            accountStatus: mapStripeStatus(subscription.status) as any,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : undefined,
          },
        });

        console.log(`[webhook] checkout completed → household ${householdId}, status=${subscription.status}`);
        break;
      }

      // ── Invoice paid (trial converts to paid, or monthly renewal) ──────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        const household = await prisma.household.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!household) break;

        const sub = await stripe.subscriptions.retrieve(subId);

        await prisma.household.update({
          where: { id: household.id },
          data: {
            accountStatus: "ACTIVE",
            subscriptionStatus: "active",
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            stripeLatestInvoiceId: invoice.id,
            pastDueAt: null,
          },
        });

        console.log(`[webhook] invoice paid → household ${household.id} is now ACTIVE`);
        break;
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        const household = await prisma.household.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!household) break;

        await prisma.household.update({
          where: { id: household.id },
          data: {
            accountStatus: "PAST_DUE",
            subscriptionStatus: "past_due",
            pastDueAt: new Date(),
          },
        });

        console.log(`[webhook] payment failed → household ${household.id} is PAST_DUE`);
        break;
      }

      // ── Subscription updated (plan change, card update, pause, etc.) ────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const household = await prisma.household.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!household) break;

        await prisma.household.update({
          where: { id: household.id },
          data: {
            subscriptionStatus: sub.status,
            accountStatus: mapStripeStatus(sub.status) as any,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
          },
        });

        console.log(`[webhook] subscription updated → household ${household.id}, status=${sub.status}`);
        break;
      }

      // ── Subscription canceled (via portal or by Stripe) ───────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const household = await prisma.household.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!household) break;

        await prisma.household.update({
          where: { id: household.id },
          data: {
            accountStatus: "CANCELED",
            subscriptionStatus: "canceled",
            canceledAt: new Date(),
          },
        });

        console.log(`[webhook] subscription canceled → household ${household.id} is CANCELED`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — error is logged
  }

  return NextResponse.json({ received: true });
}
