"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Member { id: string; userId: string; name: string; email: string; role: string; joinedAt: string; }
interface TicketSnip { id: string; subject: string; status: string; priority: string; createdAt: string; submittedBy: { name: string; email: string }; }

interface Account {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  accountStatus: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingEmail: string | null;
  trialEndsAt: string | null;
  pastDueAt: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  canceledAt: string | null;
  adminNote: string | null;
  onboardingCompleted: boolean;
  members: Member[];
  supportTickets: TicketSnip[];
  _count: { taskInstances: number; timeEntries: number; supportTickets: number };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIALING: "bg-amber-100 text-amber-700",
  PAST_DUE: "bg-orange-100 text-orange-700",
  UNPAID: "bg-red-100 text-red-700",
  SUSPENDED: "bg-red-200 text-red-800",
  CANCELED: "bg-slate-200 text-slate-600",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-brand-100 text-brand-700",
  FAMILY: "bg-green-100 text-green-700",
  MANAGER: "bg-purple-100 text-purple-700",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/accounts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setAccount(data);
      setAdminNote(data.adminNote ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  async function applyAction(action: string, suspendedReason?: string) {
    setActionLoading(true);
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, suspendedReason }),
    });
    setActionLoading(false);
    fetchAccount();
  }

  async function saveNote() {
    setSavingNote(true);
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote }),
    });
    setSavingNote(false);
  }

  if (loading) return <div className="p-8 text-slate-500">Loading account…</div>;
  if (!account) return <div className="p-8 text-red-500">Account not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/accounts" className="text-sm text-slate-400 hover:text-slate-600 mb-1 inline-block">← All Accounts</Link>
          <h1 className="text-2xl font-bold text-slate-900">{account.name}</h1>
          {account.address && <p className="text-slate-500 text-sm">{account.address}</p>}
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[account.accountStatus] ?? "bg-slate-100 text-slate-600"}`}>
          {account.accountStatus.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — account info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Subscription info */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">📋 Subscription</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Plan", value: account.subscriptionPlan ?? "—" },
                { label: "Stripe Status", value: account.subscriptionStatus ?? "—" },
                { label: "Stripe Customer", value: account.stripeCustomerId ?? "—" },
                { label: "Billing Email", value: account.billingEmail ?? "—" },
                { label: "Trial Ends", value: formatDate(account.trialEndsAt) },
                { label: "Suspended At", value: formatDate(account.suspendedAt) },
                { label: "Canceled At", value: formatDate(account.canceledAt) },
                { label: "Onboarding", value: account.onboardingCompleted ? "✅ Complete" : "⏳ Incomplete" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <p className="text-slate-700 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
            {account.suspendedReason && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                <span className="font-semibold">Suspension reason: </span>{account.suspendedReason}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">👥 Members ({account.members.length})</h2>
            <div className="space-y-2">
              {account.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {m.role}
                    </span>
                    <span className="text-xs text-slate-400">Joined {formatDate(m.joinedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tickets */}
          {account.supportTickets.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">🎫 Recent Tickets ({account._count.supportTickets})</h2>
              <div className="space-y-2">
                {account.supportTickets.map((t) => (
                  <Link key={t.id} href={`/admin/tickets/${t.id}`}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                    <div>
                      <p className="text-sm font-medium text-brand-600">{t.subject}</p>
                      <p className="text-xs text-slate-400">by {t.submittedBy.name} · {formatDate(t.createdAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Usage stats */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">📊 Usage</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Task Instances", value: account._count.taskInstances },
                { label: "Time Entries", value: account._count.timeEntries },
                { label: "Support Tickets", value: account._count.supportTickets },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-slate-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — actions + notes */}
        <div className="space-y-5">
          {/* Admin Actions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">⚡ Admin Actions</h2>
            <div className="space-y-2">
              {account.accountStatus !== "SUSPENDED" && account.accountStatus !== "CANCELED" && (
                <button
                  onClick={async () => {
                    const reason = prompt("Reason for suspension:");
                    if (reason === null) return;
                    await applyAction("SUSPEND", reason || "Admin suspension");
                  }}
                  disabled={actionLoading}
                  className="w-full text-sm px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 font-medium transition disabled:opacity-50"
                >
                  🔴 Suspend Account
                </button>
              )}
              {account.accountStatus === "SUSPENDED" && (
                <button
                  onClick={() => applyAction("REACTIVATE")}
                  disabled={actionLoading}
                  className="w-full text-sm px-3 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 font-medium transition disabled:opacity-50"
                >
                  ✅ Reactivate Account
                </button>
              )}
              {account.accountStatus === "TRIALING" && (
                <button
                  onClick={() => applyAction("EXTEND_TRIAL")}
                  disabled={actionLoading}
                  className="w-full text-sm px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 font-medium transition disabled:opacity-50"
                >
                  ⏱ Extend Trial +14 Days
                </button>
              )}
              {account.accountStatus !== "CANCELED" && (
                <button
                  onClick={async () => {
                    if (!confirm(`Cancel account "${account.name}"? This cannot be undone easily.`)) return;
                    await applyAction("CANCEL");
                  }}
                  disabled={actionLoading}
                  className="w-full text-sm px-3 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-200 font-medium transition disabled:opacity-50"
                >
                  ✕ Mark as Canceled
                </button>
              )}
            </div>
          </div>

          {/* Admin Note */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">📝 Admin Note</h2>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={5}
              className="input w-full resize-none text-sm"
              placeholder="Internal notes about this account…"
            />
            <button
              onClick={saveNote}
              disabled={savingNote}
              className="mt-2 w-full btn-primary text-sm"
            >
              {savingNote ? "Saving…" : "Save Note"}
            </button>
          </div>

          {/* Meta */}
          <div className="card p-4 text-xs text-slate-400 space-y-1">
            <p><span className="font-medium text-slate-500">Account ID:</span> {account.id}</p>
            <p><span className="font-medium text-slate-500">Created:</span> {formatDate(account.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
