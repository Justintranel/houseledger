"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-slate-600">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-brand-600 font-medium hover:underline text-sm">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-semibold text-slate-800">Password updated!</h2>
        <p className="text-slate-500 text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-slate-600 text-sm">Enter and confirm your new password below.</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Min. 8 characters"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input"
          placeholder="Repeat your new password"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-700">🏠 The House Ledger</Link>
          <p className="text-slate-500 text-sm mt-1">Set a new password</p>
        </div>
        <Suspense fallback={<p className="text-slate-500 text-sm text-center">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
