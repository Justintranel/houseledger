"use client";

import { useState, useEffect } from "react";

interface TicketComment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string; isSuperAdmin: boolean };
}

interface SupportTicket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy: { id: string; name: string };
  comments: TicketComment[];
  _count: { comments: number };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED:    "bg-green-100 text-green-700",
  CLOSED:      "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN:        "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED:    "Resolved",
  CLOSED:      "Closed",
};

const PRIORITY_ICONS: Record<string, string> = {
  LOW:    "🟢",
  NORMAL: "🔵",
  HIGH:   "🟠",
  URGENT: "🔴",
};

const CATEGORIES = ["Billing", "Technical", "Access", "Feature Request", "Other"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function SupportPage() {
  const [tickets, setTickets]         = useState<SupportTicket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<SupportTicket | null>(null);
  const [showForm, setShowForm]       = useState(false);

  // New ticket form
  const [subject,  setSubject]   = useState("");
  const [body,     setBody]      = useState("");
  const [category, setCategory]  = useState("");
  const [priority, setPriority]  = useState("NORMAL");
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  async function loadTickets() {
    try {
      const r = await fetch("/api/support/tickets");
      if (r.ok) setTickets(await r.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(); }, []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || !body.trim()) { setFormError("Subject and description are required."); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim(), category: category || undefined, priority }),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error ?? "Failed to submit ticket.");
        return;
      }
      const newTicket = await r.json();
      setTickets((prev) => [newTicket, ...prev]);
      setSubject(""); setBody(""); setCategory(""); setPriority("NORMAL");
      setShowForm(false);
      setSelected(newTicket);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Refresh selected ticket from list when tickets update
  useEffect(() => {
    if (selected) {
      const fresh = tickets.find((t) => t.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [tickets]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Get help from The House Ledger team. We typically respond within 1 business day.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSelected(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span> New Ticket
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Submit a Support Request</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
          <form onSubmit={submitTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
              <input
                className="input w-full"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select className="input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">🟢 Low</option>
                  <option value="NORMAL">🔵 Normal</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea
                className="input w-full h-32 resize-none"
                placeholder="Please describe your issue in detail. Include any steps to reproduce, error messages, or screenshots if applicable."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={10000}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{body.length} / 10,000</p>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main area */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading tickets…</p>
      ) : tickets.length === 0 && !showForm ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-medium text-slate-700 mb-1">No support tickets yet</p>
          <p className="text-sm text-slate-400 mb-4">
            Have a question or issue? We&apos;re here to help.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Open a Ticket
          </button>
        </div>
      ) : tickets.length > 0 ? (
        <div className="flex gap-4">
          {/* Ticket list */}
          <div className="w-80 shrink-0 space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setShowForm(false); }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selected?.id === t.id
                    ? "border-brand-300 bg-brand-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1 flex-1">{t.subject}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{PRIORITY_ICONS[t.priority]}</span>
                  {t.category && <span>{t.category}</span>}
                  <span className="ml-auto">{t._count.comments} reply{t._count.comments !== 1 ? "ies" : ""}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(t.createdAt)}</p>
              </button>
            ))}
          </div>

          {/* Ticket detail */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <div className="card">
                {/* Ticket header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800">{selected.subject}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {STATUS_LABELS[selected.status] ?? selected.status}
                      </span>
                      <span>{PRIORITY_ICONS[selected.priority]} {selected.priority.charAt(0) + selected.priority.slice(1).toLowerCase()} priority</span>
                      {selected.category && <span>· {selected.category}</span>}
                      <span>· {formatDate(selected.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Original message */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Original Request</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.body}</p>
                </div>

                {/* Comments thread */}
                {selected.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Replies</p>
                    {selected.comments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-xl p-4 ${
                          c.author.isSuperAdmin
                            ? "bg-brand-50 border border-brand-100"
                            : "bg-white border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${c.author.isSuperAdmin ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {c.author.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {c.author.isSuperAdmin ? "🛡️ House Ledger Support" : c.author.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resolved / Closed notice */}
                {(selected.status === "RESOLVED" || selected.status === "CLOSED") ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-green-700">
                      {selected.status === "RESOLVED" ? "✅ This ticket has been resolved." : "This ticket is closed."}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      If you need further assistance, please open a new ticket.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Our team will review your request and reply here. You&apos;ll see updates on this page when we respond.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
