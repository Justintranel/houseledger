"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string; isSuperAdmin: boolean };
}

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  category: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  household: { id: string; name: string; accountStatus: string };
  submittedBy: { id: string; name: string; email: string };
  comments: Comment[];
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-200 text-slate-500",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/tickets/${id}`);
    if (res.ok) {
      const data = await res.json();
      setTicket(data);
      setAdminNote(data.adminNote ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    await fetch(`/api/admin/tickets/${id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText.trim(), isInternal }),
    });
    setSending(false);
    setReplyText("");
    fetchTicket();
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingStatus(false);
    fetchTicket();
  }

  async function saveNote() {
    setSavingNote(true);
    await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote }),
    });
    setSavingNote(false);
  }

  if (loading) return <div className="p-8 text-slate-500">Loading ticket…</div>;
  if (!ticket) return <div className="p-8 text-red-500">Ticket not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/tickets" className="text-sm text-slate-400 hover:text-slate-600 mb-1 inline-block">← All Tickets</Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex-1">{ticket.subject}</h1>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_COLORS[ticket.status] ?? "bg-slate-100"}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
          <span>From: <strong className="text-slate-700">{ticket.submittedBy.name}</strong> ({ticket.submittedBy.email})</span>
          <span>·</span>
          <Link href={`/admin/accounts/${ticket.household.id}`} className="text-brand-600 hover:underline">
            {ticket.household.name}
          </Link>
          <span>·</span>
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
        {ticket.category && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{ticket.category}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — ticket body + comments */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original message */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Original Message</p>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
          </div>

          {/* Comment thread */}
          {ticket.comments.length > 0 && (
            <div className="space-y-3">
              {ticket.comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl px-4 py-3 border ${
                    c.isInternal
                      ? "bg-yellow-50 border-yellow-200"
                      : c.author.isSuperAdmin
                      ? "bg-brand-50 border-brand-100"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{c.author.name}</span>
                      {c.author.isSuperAdmin && (
                        <span className="text-xs px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium">Admin</span>
                      )}
                      {c.isInternal && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">🔒 Internal</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          {ticket.status !== "CLOSED" && (
            <div className="card p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Add Reply</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="input w-full resize-none text-sm"
                placeholder="Type your reply…"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="accent-brand-600"
                  />
                  🔒 Internal note (hidden from user)
                </label>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — actions + note */}
        <div className="space-y-4">
          {/* Status controls */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">🔄 Update Status</p>
            <div className="space-y-2">
              {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updatingStatus || ticket.status === s}
                  className={`w-full text-sm px-3 py-2 rounded-xl font-medium transition ${
                    ticket.status === s
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">📝 Internal Note</p>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={4}
              className="input w-full resize-none text-sm"
              placeholder="Private notes for this ticket…"
            />
            <button onClick={saveNote} disabled={savingNote} className="mt-2 w-full btn-primary text-sm">
              {savingNote ? "Saving…" : "Save Note"}
            </button>
          </div>

          {/* Meta */}
          <div className="card p-4 text-xs text-slate-400 space-y-1">
            <p><span className="font-medium text-slate-500">Priority:</span> {ticket.priority}</p>
            <p><span className="font-medium text-slate-500">Created:</span> {formatDate(ticket.createdAt)}</p>
            {ticket.resolvedAt && <p><span className="font-medium text-slate-500">Resolved:</span> {formatDate(ticket.resolvedAt)}</p>}
            {ticket.closedAt && <p><span className="font-medium text-slate-500">Closed:</span> {formatDate(ticket.closedAt)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
