import Stripe from "stripe";

// Singleton Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  standard: {
    name: "The House Ledger System",
    priceId: process.env.STRIPE_PRICE_ID_STANDARD || "price_placeholder_standard",
    price: 99,
    description: "Everything you need to manage your home and your house manager — in one place.",
    features: [
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
    ],
  },
};

/**
 * Create a Stripe Checkout Session for a new subscription.
 * Supports 50% discount via promo code OR eligibility token.
 * (Legacy — used by pre-auth signup flow.)
 */
export async function createCheckoutSession({
  email,
  planId,
  promoCode,
  successUrl,
  cancelUrl,
}: {
  email: string;
  planId: "standard";
  promoCode?: string;
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
  });

  return session;
}

/**
 * Create a Stripe Checkout Session for an authenticated household owner.
 * Includes a 7-day free trial with card capture — auto-converts to $99/month.
 */
export async function createBillingCheckoutSession({
  email,
  householdId,
  successUrl,
  cancelUrl,
}: {
  email: string;
  householdId: string;
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
    client_reference_id: householdId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
