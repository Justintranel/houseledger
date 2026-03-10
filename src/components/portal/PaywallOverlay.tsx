"use client";

import Link from "next/link";

interface Props {
  accountStatus: string;
}

export default function PaywallOverlay({ accountStatus }: Props) {
  const isCanceled = accountStatus === "CANCELED" || accountStatus === "SUSPENDED";

  if (!isCanceled) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      {/* Frosted glass backdrop — content is still visible but unusable */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />

      {/* Lockout card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Your subscription has ended
        </h2>
        <p className="text-sm text-slate-500 mb-1 leading-relaxed">
          All your household data is saved and waiting for you.
          Reactivate your account to get back to managing your home.
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Monthly ($99/mo) or Annual ($891/yr — save 25%) plans available.
        </p>

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-center w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          Reactivate My Account →
        </Link>

        <p className="text-xs text-slate-400 mt-3">
          No setup fee · Cancel anytime
        </p>
      </div>
    </div>
  );
}
