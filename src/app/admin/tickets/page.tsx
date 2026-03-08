"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  household: { id: string; name: string };
  submittedBy: { id: string; name: string; email: string };
  _count: { comments: number };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-200 text-slate-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-600 font-bold",
  HIGH: "text-orange-600 font-semibold",
  NORMAL: "text-slate-600",
  LOW: "text-slate-400",
};

const PRIORITY_ICONS: Record<string, string> = {
  URGENT: "🔴",
  HIGH: "🟠",
  NORMAL: "🟡",
  LOW: "⚪",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminTicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/tickets?${params}`);
    if (res.ok) setTickets(await res.json());
    setLoading(false);
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">All tickets submitted by users</p>
        </div>
        <span className="text-sm text-slate-500">{tickets.length} tickets</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search subject or body…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-64 text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input text-sm">
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-medium text-slate-600">No tickets found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Household</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">From</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Replies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.id}`} className="font-semibold text-brand-600 hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/accounts/${t.household.id}`} className="text-slate-600 hover:text-brand-600 hover:underline">
                      {t.household.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{t.submittedBy.name}</p>
                    <p className="text-xs text-slate-400">{t.submittedBy.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? "bg-slate-100"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${PRIORITY_COLORS[t.priority] ?? ""}`}>
                    {PRIORITY_ICONS[t.priority]} {t.priority}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.category ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{t._count.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
