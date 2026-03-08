"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-700">🏠 The House Ledger</Link>
          <p className="text-slate-500 text-sm mt-1">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-semibold text-slate-800">Check your email</h2>
            <p className="text-slate-500 text-sm">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <Link href="/login" className="block text-brand-600 font-medium hover:underline text-sm mt-4">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-slate-600 text-sm">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="text-brand-600 font-medium hover:underline">← Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
