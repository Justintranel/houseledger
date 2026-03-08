"use client";

import Link from "next/link";

interface Props {
  type: "trial" | "past_due";
  daysLeft?: number;
}

export default function SubscriptionBanner({ type, daysLeft = 0 }: Props) {
  if (type === "trial") {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between shrink-0">
        <span>
          🕐 <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</strong> in your free trial
        </span>
        <Link
          href="/dashboard/billing"
          className="ml-4 inline-flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-lg transition"
        >
          Add Payment Method →
        </Link>
      </div>
    );
  }

  if (type === "past_due") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800 flex items-center justify-between shrink-0">
        <span>
          ⚠️ <strong>Payment failed</strong> — your account may be suspended soon
        </span>
        <Link
          href="/dashboard/billing"
          className="ml-4 inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition"
        >
          Update Payment Method →
        </Link>
      </div>
    );
  }

  return null;
}
