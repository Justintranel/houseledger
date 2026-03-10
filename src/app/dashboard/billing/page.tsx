"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";

interface BillingData {
  accountStatus: string;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "MMMM d, yyyy");
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const trialStarted = searchParams.get("trial") === "started";

  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/billing-status");
      if (!res.ok) throw new Error("Failed to load billing info");
      const data = await res.json();
      setBilling(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load billing info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleCheckout = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open billing portal");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setActionLoading(false);
    }
  };

  const handleUpgradeToAnnual = async () => {
    setUpgradeLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/upgrade-to-annual", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upgrade");
      setUpgradeSuccess(true);
      await fetchBilling(); // refresh billing data
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const {
    accountStatus,
    subscriptionPlan,
    stripeSubscriptionId,
    stripeCurrentPeriodEnd,
    trialEndsAt,
  } = billing ?? {};

  const hasStripeSubscription = !!stripeSubscriptionId;
  const daysLeft = daysUntil(trialEndsAt ?? null);
  const isCanceled = accountStatus === "CANCELED" || accountStatus === "SUSPENDED";
  const isPastDue = accountStatus === "PAST_DUE";
  const isActive = accountStatus === "ACTIVE" || accountStatus === "TRIALING";
  const isAnnual = subscriptionPlan === "annual";
  const canUpgradeToAnnual = hasStripeSubscription && isActive && !isAnnual;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and payment method.</p>
      </div>

      {/* Welcome banner (shown after onboarding) */}
      {isWelcome && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          🎉 <strong>Your household is set up!</strong> Start your 7-day free trial below — your card won&apos;t be charged until the trial ends.
        </div>
      )}

      {/* Trial started confirmation */}
      {trialStarted && (
        <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-xl text-brand-800 text-sm">
          ✅ <strong>Trial started!</strong> You have full access for 7 days. Your card will be charged $99 when the trial ends.
        </div>
      )}

      {/* Annual upgrade success */}
      {upgradeSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          🎉 <strong>Upgraded to Annual!</strong> You&apos;re now on the annual plan. Any unused time from your monthly plan has been credited.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── STATE 1: No Stripe subscription yet — trial window open ─────────── */}
      {!hasStripeSubscription && !isCanceled && (
        <div className="card p-8 border-2 border-brand-600 ring-2 ring-brand-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-4">
              🕐 {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">The House Ledger System</h2>
            <div className="flex items-end justify-center gap-1 mt-3">
              <span className="text-5xl font-bold text-brand-600">$99</span>
              <span className="text-slate-400 pb-1.5">/month</span>
            </div>
            {trialEndsAt && (
              <p className="text-sm text-slate-500 mt-2">
                Trial ends {formatDate(trialEndsAt ?? null)} · Auto-renews monthly
              </p>
            )}
          </div>

          <ul className="space-y-2 mb-8">
            {[
              "Unlimited tasks & calendar",
              "House manager + unlimited family members",
              "Real-time chat (channels & direct messages)",
              "Purchase approvals & receipt storage",
              "Time tracking & payroll exports",
              "Contract e-sign",
              "House Profile, SOPs, Vendors & more",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 font-bold shrink-0">✓</span> {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleCheckout}
            disabled={actionLoading}
            className="btn-primary w-full py-4 text-base font-semibold"
          >
            {actionLoading ? "Redirecting to Stripe…" : "Start Free Trial →"}
          </button>

          <div className="mt-4 space-y-1.5 text-center">
            <p className="text-xs text-slate-400">
              🔒 Card captured securely by Stripe · Not charged until {formatDate(trialEndsAt ?? null)}
            </p>
            <p className="text-xs text-slate-400">Cancel anytime before the trial ends to pay nothing</p>
          </div>
        </div>
      )}

      {/* ── STATE 2: Active or Trialing subscription ─────────────────────────── */}
      {hasStripeSubscription && isActive && !isPastDue && (
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">✅</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {accountStatus === "TRIALING" ? "Free Trial Active" : "Active Subscription"}
              </h2>
              <p className="text-sm text-slate-500">
                {accountStatus === "TRIALING"
                  ? `Trial ends ${formatDate(trialEndsAt ?? null)} — then ${isAnnual ? "$891/year" : "$99/month"}`
                  : `The House Ledger System · ${isAnnual ? "$891/year" : "$99/month"}`}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-900 flex items-center gap-1.5">
                The House Ledger System
                {isAnnual && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    Annual
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-500">
                {accountStatus === "TRIALING" ? "Trial ends" : "Next billing date"}
              </span>
              <span className="font-medium text-slate-900">
                {formatDate(accountStatus === "TRIALING" ? (trialEndsAt ?? null) : (stripeCurrentPeriodEnd ?? null))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-500">Amount</span>
              <span className="font-medium text-slate-900">
                {isAnnual ? "$891.00 / year" : "$99.00 / month"}
              </span>
            </div>
          </div>

          <button
            onClick={handlePortal}
            disabled={actionLoading}
            className="btn-primary w-full"
          >
            {actionLoading ? "Opening billing portal…" : "Manage Billing →"}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Update payment method · View invoices · Cancel subscription
          </p>
        </div>
      )}

      {/* ── Annual Upgrade Card (visible on monthly active/trialing plans) ───── */}
      {canUpgradeToAnnual && !upgradeSuccess && (
        <div className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⭐</span>
                <h3 className="font-bold text-slate-900">Upgrade to Annual — Save 25%</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Switch to annual billing and pay <strong>$891/year</strong> instead of $1,188 — you save{" "}
                <strong className="text-amber-700">$297 every year</strong>. That&apos;s just $74.25/month, billed once.
                Any unused days on your current monthly plan are credited automatically.
              </p>
              <ul className="text-xs text-slate-500 space-y-0.5">
                <li>✓ Same full access — nothing changes except billing frequency</li>
                <li>✓ 12 months before your next renewal</li>
                <li>✓ Cancel anytime — prorated refund for unused time</li>
              </ul>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-amber-700">$891</div>
              <div className="text-xs text-slate-400">/year</div>
            </div>
          </div>
          <button
            onClick={handleUpgradeToAnnual}
            disabled={upgradeLoading}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-6 rounded-xl transition disabled:opacity-60"
          >
            {upgradeLoading ? "Upgrading…" : "Upgrade to Annual Plan →"}
          </button>
        </div>
      )}

      {/* ── STATE 3: Past Due ─────────────────────────────────────────────────── */}
      {hasStripeSubscription && isPastDue && (
        <div className="card p-8 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">⚠️</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Failed</h2>
              <p className="text-sm text-slate-500">Your last payment didn&apos;t go through.</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Please update your payment method to keep your household active. If payment continues to fail,
            your account may be suspended.
          </p>

          <button
            onClick={handlePortal}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg w-full transition"
          >
            {actionLoading ? "Opening billing portal…" : "Update Payment Method →"}
          </button>
        </div>
      )}

      {/* ── STATE 4: Canceled ─────────────────────────────────────────────────── */}
      {isCanceled && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your subscription has ended</h2>
          <p className="text-sm text-slate-500 mb-6">
            All your data is saved and waiting for you. Resubscribe to regain full access.
          </p>

          {/* Monthly option */}
          <button
            onClick={handleCheckout}
            disabled={actionLoading}
            className="btn-primary w-full mb-3"
          >
            {actionLoading ? "Redirecting to Stripe…" : "Resubscribe Monthly — $99/mo →"}
          </button>

          {/* Annual option */}
          <div className="relative mt-2">
            <div className="relative rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">⭐ Annual Plan — Best Value</span>
                <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">SAVE $297</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                $891/year · $74.25/month effective · 25% off vs monthly · 12 months of full access
              </p>
              <button
                onClick={handleCheckout}
                disabled={actionLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-xl transition text-sm"
              >
                {actionLoading ? "Redirecting…" : "Resubscribe Annual — $891/yr →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-10 border-t border-slate-200 pt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Billing FAQ</h3>
        {[
          {
            q: "When will my card be charged?",
            a: "Your card will not be charged during the 7-day trial. If you don't cancel before the trial ends, you'll be charged $99 on the day it converts.",
          },
          {
            q: "Can I cancel anytime?",
            a: 'Yes. Click "Manage Billing" to access the Stripe portal where you can cancel immediately. You\'ll retain access until the end of your current billing period.',
          },
          {
            q: "Is there a long-term contract?",
            a: "No. It's month-to-month or year-to-year. No cancellation fees.",
          },
          {
            q: "How does upgrading to annual work?",
            a: "When you upgrade from monthly to annual, any unused days on your current billing period are automatically credited. You're charged $891 upfront and won't be billed again for 12 months.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="border-b border-slate-100 py-3">
            <p className="text-sm font-medium text-slate-800 mb-1">{q}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-400">Loading…</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
