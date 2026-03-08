"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Create user account
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      setError(regData.error || "Registration failed.");
      setLoading(false);
      return;
    }

    // 2. Sign in immediately (so they have a session for onboarding)
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please log in manually.");
      setLoading(false);
      return;
    }

    // 3. Go to onboarding
    router.push("/onboarding");
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl px-8 py-10">
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-bold text-brand-700">🏠 The House Ledger System</Link>
        <p className="text-slate-500 text-sm mt-1">Create your household account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Min. 8 characters"
          />
        </div>

        {/* 7-day trial callout */}
        <div className="p-3 rounded-lg border-2 border-brand-600 bg-brand-50">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm text-slate-900">The House Ledger System</p>
            <p className="text-brand-600 font-bold text-sm">$99/mo</p>
          </div>
          <p className="text-xs text-slate-500">
            7-day free trial · Card required · Auto-renews monthly · Cancel anytime
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create Account →"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        You&apos;ll add your payment method after setting up your household.
      </p>
      <p className="text-center text-sm text-slate-500 mt-3">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-white">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
