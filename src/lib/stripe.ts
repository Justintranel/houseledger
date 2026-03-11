import Stripe from "stripe";

// Singleton Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
  typescript: true,
});

const PLAN_FEATURES = [
  "Unlimited tasks & calendar",
  "House manager + unlimited family members",
  "Real-time chat (channels & direct messages)",
  "House Profile — 100+ question knowledge base",
  "House SOPs — room-by-room instructions & photos",
  "Inventory tracking & shopping list",
  "Purchase approvals & receipt storage",
  "Time tracking & payroll exports",
  "Contract e-sign (internal signature app)",
  "Vendor directory",
  "Notes & daily logs",
  "All House Ledger materials included",
];

export const PLANS = {
  standard: {
    name: "The House Ledger System",
    priceId: process.env.STRIPE_PRICE_ID_STANDARD || "price_placeholder_standard",
    price: 99,
    interval: "month" as const,
    description: "Everything you need to manage your home and your house manager — in one place.",
    features: PLAN_FEATURES,
  },
  annual: {
    name: "The House Ledger System — Annual",
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL || "price_placeholder_annual",
    price: 891,           // $891/year (25% off $1,188)
    priceMonthly: 74.25,  // effective monthly rate
    savings: 297,         // savings vs 12× monthly
    interval: "year" as const,
    description: "Everything included, billed once a year. Save 25% vs monthly.",
    features: PLAN_FEATURES,
  },
};

/**
 * Create a Stripe Checkout Session for a new subscription.
 * Supports 50% discount via promo code OR eligibility token.
 * (Legacy — used by pre-auth signup flow.)
 *
 * Pass referralId from Rewardful so affiliate commissions are attributed.
 */
export async function createCheckoutSession({
  email,
  planId,
  promoCode,
  referralId,
  successUrl,
  cancelUrl,
}: {
  email: string;
  planId: "standard";
  promoCode?: string;
  referralId?: string;  // Rewardful affiliate referral ID
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  // Look up promo code if provided
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (promoCode) {
    try {
      const codes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (codes.data.length > 0) {
        discounts = [{ promotion_code: codes.data[0].id }];
      }
    } catch {
      // Invalid promo — proceed without discount
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    discounts,
    allow_promotion_codes: !promoCode, // show promo input if not pre-applied
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { planId },
    // Rewardful reads client_reference_id to attribute commissions to affiliates
    ...(referralId ? { client_reference_id: referralId } : {}),
  });

  return session;
}

/**
 * Create a Stripe Checkout Session for an authenticated household owner.
 * Includes a 7-day free trial with card capture — auto-converts to $99/month.
 *
 * When an affiliate referral is active, client_reference_id is set to the
 * Rewardful referral ID so Rewardful can attribute the commission automatically
 * via Stripe webhook events. householdId is always preserved in metadata so
 * our webhook handler is unaffected (it checks metadata.householdId first).
 */
export async function createBillingCheckoutSession({
  email,
  householdId,
  referralId,
  successUrl,
  cancelUrl,
}: {
  email: string;
  householdId: string;
  referralId?: string;  // Rewardful affiliate referral ID
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PLANS.standard;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { householdId },
    },
    payment_method_collection: "always", // capture card even during trial
    allow_promotion_codes: true,
    metadata: { householdId },
    // Rewardful reads client_reference_id to attribute commissions.
    // householdId stays in metadata so our webhook always finds it there first.
    client_reference_id: referralId || householdId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
