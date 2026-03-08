"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RecentClient {
  id: string;
  householdName: string;
  ownerName: string;
  ownerEmail: string;
  accountStatus: string;
  subscriptionPlan: string | null;
  memberCount: number;
  createdAt: string;
}

interface Stats {
  accounts: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    suspended: number;
    canceled: number;
    newThisMonth: number;
    canceledThisMonth: number;
  };
  users: {
    total: number;
    owners: number;
    managers: number;
    admins: number;
  };
  billing: {
    mrr: number;
    arr: number;
    ltv: number;
    growthPct: number;
    churnRate: number;
  };
  support: {
    openTickets: number;
    totalTickets: number;
  };
  recentClients: RecentClient[];
}

function StatCard({
  label,
  value,
  sub,
  color = "brand",
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "brand" | "green" | "amber" | "red" | "purple";
  href?: string;
}) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  const card = (
    <div className={`rounded-xl border p-5 ${colorMap[color]} ${href ? "hover:shadow-md transition cursor-pointer" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold leading-none">{value}</p>
      {sub && <p className="text-xs mt-1.5 opacity-60">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIALING: "bg-amber-100 text-amber-700",
  PAST_DUE: "bg-orange-100 text-orange-700",
  UNPAID: "bg-red-100 text-red-700",
  SUSPENDED: "bg-red-200 text-red-800",
  CANCELED: "bg-slate-200 text-slate-600",
};

function statusBadge(status: string) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function currency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 text-slate-500">Loading admin overview…</div>
    );

  if (!stats)
    return (
      <div className="p-8 text-red-500">Failed to load stats. Make sure you're signed in as Super Admin.</div>
    );

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">House Ledger SaaS — live metrics</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-3 py-1">
          🔐 Super Admin
        </span>
      </div>

      {/* MRR / ARR / LTV Row */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">💰 Revenue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="MRR" value={currency(stats.billing.mrr)} sub="Monthly Recurring Revenue" color="green" />
          <StatCard label="ARR" value={currency(stats.billing.arr)} sub="Annual Recurring Revenue" color="green" />
          <StatCard label="Est. LTV" value={currency(stats.billing.ltv)} sub="~14mo avg (est.)" color="purple" />
          <StatCard
            label="Growth"
            value={`${stats.billing.growthPct >= 0 ? "+" : ""}${stats.billing.growthPct}%`}
            sub="vs last month new accounts"
            color={stats.billing.growthPct >= 0 ? "green" : "red"}
          />
        </div>
      </section>

      {/* Account Status Row */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">🏠 Accounts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={fmt(stats.accounts.total)} href="/admin/accounts" color="brand" />
          <StatCard label="Active" value={fmt(stats.accounts.active)} href="/admin/accounts?status=ACTIVE" color="green" />
          <StatCard label="Trialing" value={fmt(stats.accounts.trialing)} href="/admin/accounts?status=TRIALING" color="amber" />
          <StatCard label="Past Due" value={fmt(stats.accounts.pastDue)} href="/admin/accounts?status=PAST_DUE" color="amber" />
          <StatCard label="Suspended" value={fmt(stats.accounts.suspended)} href="/admin/accounts?status=SUSPENDED" color="red" />
          <StatCard label="Canceled" value={fmt(stats.accounts.canceled)} href="/admin/accounts?status=CANCELED" color="red" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 max-w-xs">
          <StatCard label="New This Month" value={fmt(stats.accounts.newThisMonth)} color="green" />
          <StatCard
            label="Churn Rate"
            value={`${stats.billing.churnRate}%`}
            sub="canceled this month"
            color={stats.billing.churnRate > 5 ? "red" : "green"}
          />
        </div>
      </section>

      {/* Users Row */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">👥 Users</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={fmt(stats.users.total)} color="brand" />
          <StatCard label="Owners" value={fmt(stats.users.owners)} color="brand" />
          <StatCard label="House Managers" value={fmt(stats.users.managers)} color="brand" />
          <StatCard label="Super Admins" value={fmt(stats.users.admins)} color="purple" />
        </div>
      </section>

      {/* Support Row */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">🎫 Support</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <StatCard
            label="Open Tickets"
            value={fmt(stats.support.openTickets)}
            sub="Needs attention"
            color={stats.support.openTickets > 0 ? "amber" : "green"}
            href="/admin/tickets"
          />
          <StatCard label="Total Tickets" value={fmt(stats.support.totalTickets)} href="/admin/tickets" color="brand" />
        </div>
      </section>

      {/* Recent Clients */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">👤 Recent Clients</h2>
          <Link href="/admin/accounts" className="text-xs text-brand-600 hover:underline font-medium">
            View all {stats.accounts.total} accounts →
          </Link>
        </div>
        {stats.recentClients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center text-slate-400 text-sm">
            No client accounts yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Household</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{c.ownerName}</p>
                      <p className="text-xs text-slate-400">{c.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.householdName}</td>
                    <td className="px-4 py-3">{statusBadge(c.accountStatus)}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{c.subscriptionPlan ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{c.memberCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/accounts/${c.id}`}
                        className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium transition"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">⚡ Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/accounts?status=PAST_DUE"
            className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 transition">
            View Past-Due Accounts →
          </Link>
          <Link href="/admin/accounts?status=SUSPENDED"
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition">
            View Suspended Accounts →
          </Link>
          <Link href="/admin/tickets?status=OPEN"
            className="px-4 py-2 bg-brand-100 text-brand-800 rounded-lg text-sm font-medium hover:bg-brand-200 transition">
            Open Support Tickets →
          </Link>
        </div>
      </section>

      {/* Stripe Integration Notice */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">📌 Stripe Integration Pending</p>
        <p>Revenue figures are calculated from the database (<code>subscriptionPlan × active accounts</code>). Once Stripe webhooks are connected, MRR/ARR will reflect real payment data including proration, discounts, and refunds. Webhook handler is already wired at <code>/api/stripe/webhook</code>.</p>
      </div>
    </div>
  );
}
