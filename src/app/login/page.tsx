"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    // Read the freshly-minted JWT to decide where to land.
    // getSession() calls /api/auth/session which decodes the cookie we just received.
    const session = await getSession();
    const isSuperAdmin = (session?.user as any)?.isSuperAdmin === true;

    // Hard navigate — ensures server middleware runs fresh on the destination page.
    window.location.href = isSuperAdmin ? "/admin" : "/dashboard";
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-bold text-brand-700">🏠 The House Ledger System</Link>
        <p className="text-slate-500 text-sm mt-1">Sign in to your household</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-medium hover:underline">Get started</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-white">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
