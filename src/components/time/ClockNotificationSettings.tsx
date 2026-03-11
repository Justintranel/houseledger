"use client";
import { useState, useEffect } from "react";

export default function ClockNotificationSettings() {
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load current settings on mount
  useEffect(() => {
    fetch("/api/household")
      .then((r) => r.json())
      .then((data) => {
        setNotifyEmail(data.clockNotifyEmail ?? "");
        setNotifyPhone(data.clockNotifyPhone ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockNotifyEmail: notifyEmail.trim() || null,
          clockNotifyPhone: notifyPhone.trim() || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
        Loading notification settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            Clock In / Out Notifications
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Get notified automatically whenever your house manager clocks in or out. Leave fields blank to disable.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Notification Email
          </label>
          <input
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            className="input w-full"
            placeholder="e.g. owner@example.com"
          />
          <p className="text-xs text-slate-400 mt-1">
            You'll receive an email each time your manager clocks in or out.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Notification Phone (SMS / Text)
          </label>
          <input
            type="text"
            value={notifyPhone}
            onChange={(e) => setNotifyPhone(e.target.value)}
            className="input w-full"
            placeholder="e.g. +12025551234 (E.164 format)"
          />
          <p className="text-xs text-slate-400 mt-1">
            Enter your mobile number in E.164 format (e.g.{" "}
            <code>+12025551234</code>). You'll receive a text each time your
            manager clocks in or out.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-green-700 mb-1">
            📱 SMS is included — no setup needed
          </p>
          <p className="text-xs text-green-700">
            Text notifications are sent from The House Ledger's centralized
            number. Just enter your phone number above and save — that's it.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm"
          >
            {saving ? "Saving…" : "Save Notification Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
