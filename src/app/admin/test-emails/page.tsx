"use client";
import { useState } from "react";

const EMAIL_DESCRIPTIONS = [
  { name: "Password Reset", trigger: "User clicks 'Forgot Password' or admin triggers a reset", recipient: "Account owner / manager", icon: "🔑" },
  { name: "Welcome Email", trigger: "New owner account is created", recipient: "New owner", icon: "🎉" },
  { name: "Manager Invite", trigger: "Owner adds a House Manager", recipient: "House manager", icon: "🤝" },
  { name: "Family Member Invite", trigger: "Owner invites a family member", recipient: "Family member", icon: "👨‍👩‍👧" },
  { name: "Purchase Request", trigger: "Manager submits an approval request", recipient: "Owner", icon: "💳" },
  { name: "Purchase Approved", trigger: "Owner approves a purchase", recipient: "House manager", icon: "✅" },
  { name: "Purchase Denied", trigger: "Owner denies a purchase", recipient: "House manager", icon: "❌" },
  { name: "Clock In", trigger: "House manager clocks in (if notifications enabled)", recipient: "Owner's notification email", icon: "⏱" },
  { name: "Clock Out", trigger: "House manager clocks out (if notifications enabled)", recipient: "Owner's notification email", icon: "🏁" },
  { name: "Weekly Summary", trigger: "Every Friday evening (automated cron)", recipient: "Owner", icon: "📋" },
];

export default function TestEmailsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  async function sendAll(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/admin/test-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send test emails.");
        return;
      }
      setResults(data.results);
    } catch (err) {
      setError("Network error — check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">📧 Test Emails</h1>
        <p className="text-sm text-slate-500 mt-1">
          Send a sample of every email in the system to any address. Uses real Resend — check your inbox.
        </p>
      </div>

      {/* Send form */}
      <form onSubmit={sendAll} className="card p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Send all 10 test emails to:</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input flex-1"
            placeholder="your@email.com"
            required
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send All"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          All 10 emails will be sent with realistic sample data so you can see exactly what your clients receive.
        </p>
      </form>

      {/* Results */}
      {results && (
        <div className="card p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Results: {results.filter(r => r.startsWith("✅")).length} / {results.length} sent successfully
          </h2>
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <p key={i} className={`text-sm font-mono ${r.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
                {r}
              </p>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-8">{error}</div>
      )}

      {/* Email catalog */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All System Emails</h2>
        <div className="card p-0 overflow-hidden divide-y divide-slate-100">
          {EMAIL_DESCRIPTIONS.map((email) => (
            <div key={email.name} className="px-5 py-4 flex items-start gap-4">
              <span className="text-2xl mt-0.5">{email.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{email.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-600">Triggered when:</span> {email.trigger}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Sent to:</span> {email.recipient}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
