"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Account {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  accountStatus: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  billingEmail: string | null;
  trialEndsAt: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  canceledAt: string | null;
  adminNote: string | null;
  onboardingCompleted: boolean;
  openTickets: number;
  members: Member[];
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/accounts?${params}`);
    if (res.ok) setAccounts(await res.json());
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function applyAction(id: string, action: string, reason?: string) {
    setActionLoading(id + action);
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, suspendedReason: reason }),
    });
    setActionLoading(null);
    if (res.ok) fetchAccounts();
  }

  async function handleSuspend(id: string, name: string) {
    const reason = prompt(`Reason for suspending "${name}":`);
    if (reason === null) return;
    await applyAction(id, "SUSPEND", reason || "Non-payment");
  }

  const STATUSES = ["", "ACTIVE", "TRIALING", "PAST_DUE", "SUSPENDED", "CANCELED"];

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">All household accounts on the platform</p>
        </div>
        <span className="text-sm text-slate-500">{accounts.length} accounts</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-64 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">No accounts found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Household</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => {
                const owner = a.members.find((m) => m.role === "OWNER");
                const busy = actionLoading?.startsWith(a.id);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/accounts/${a.id}`} className="font-semibold text-brand-600 hover:underline">
                        {a.name}
                      </Link>
                      {a.address && <p className="text-xs text-slate-400 truncate max-w-[180px]">{a.address}</p>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(a.accountStatus)}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{a.subscriptionPlan ?? "—"}</td>
                    <td className="px-4 py-3">
                      {owner ? (
                        <div>
                          <p className="font-medium text-slate-700">{owner.name}</p>
                          <p className="text-xs text-slate-400">{owner.email}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.members.length}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      {a.openTickets > 0 ? (
                        <Link href={`/admin/tickets`} className="text-amber-600 font-semibold">{a.openTickets} open</Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Link
                          href={`/admin/accounts/${a.id}`}
                          className="text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium transition"
                        >
                          View
                        </Link>
                        {a.accountStatus !== "SUSPENDED" && a.accountStatus !== "CANCELED" && (
                          <button
                            onClick={() => handleSuspend(a.id, a.name)}
                            disabled={!!busy}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        {a.accountStatus === "SUSPENDED" && (
                          <button
                            onClick={() => applyAction(a.id, "REACTIVATE")}
                            disabled={!!busy}
                            className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
                        {a.accountStatus === "TRIALING" && (
                          <button
                            onClick={() => applyAction(a.id, "EXTEND_TRIAL")}
                            disabled={!!busy}
                            className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition disabled:opacity-50"
                          >
                            +14d Trial
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
