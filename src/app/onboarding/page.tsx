"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

// ── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  label: string;
  icon: string;
  optional?: boolean;
}

const STEPS: Step[] = [
  { id: "household", label: "Your Home",      icon: "🏠" },
  { id: "family",    label: "Family",          icon: "👨‍👩‍👧", optional: true },
  { id: "manager",   label: "House Manager",   icon: "🤝", optional: true },
  { id: "schedule",  label: "Work Schedule",   icon: "📅", optional: true },
  { id: "tasks",     label: "Starter Tasks",   icon: "✅" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SAMPLE_TASKS = [
  { icon: "🌅", title: "Morning walkthrough",    freq: "Daily" },
  { icon: "🍽️",  title: "Load/unload dishwasher", freq: "Daily" },
  { icon: "🧹",  title: "Vacuum all floors",      freq: "Every Monday" },
  { icon: "🛁",  title: "Clean bathrooms",        freq: "Every Wednesday" },
  { icon: "🛒",  title: "Grocery shopping",       freq: "Every Friday" },
  { icon: "🔧",  title: "Replace HVAC filter",    freq: "Monthly" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Safety net: Super Admins should never see this page
  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.isSuperAdmin) {
      router.replace("/admin");
    }
  }, [session, status, router]);

  const [step, setStep]     = useState(0);
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // — Step 0: Household
  const [householdName, setHouseholdName] = useState("");
  const [address, setAddress]             = useState("");

  // — Step 1: Family
  const [familyEmails, setFamilyEmails] = useState<string[]>([""]);

  // — Step 2: Manager
  const [managerEmail, setManagerEmail] = useState("");

  // — Step 3: Schedule
  const [workDays,  setWorkDays]  = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd,   setWorkEnd]   = useState("17:00");

  // — Step 4: Tasks
  const [includeStarterTasks, setIncludeStarterTasks] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function addFamilyEmail() {
    setFamilyEmails((prev) => [...prev, ""]);
  }

  function updateFamilyEmail(index: number, value: string) {
    setFamilyEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  function removeFamilyEmail(index: number) {
    setFamilyEmails((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDay(i: number) {
    setWorkDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
    );
  }

  function validateStep(): boolean {
    setError("");
    if (step === 0 && !householdName.trim()) {
      setError("Please enter a name for your household.");
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function submit() {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdName: householdName.trim(),
          address: address.trim() || undefined,
          familyEmails: familyEmails.map((e) => e.trim()).filter(Boolean),
          managerEmail: managerEmail.trim() || undefined,
          workDays,
          workStart,
          workEnd,
          includeStarterTasks,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Something went wrong");
      }

      // Update the JWT so the middleware sees onboardingCompleted = true
      // without needing a sign-out/sign-in cycle
      await update({ onboardingCompleted: true });

      setDone(true);

      // Brief celebration → then navigate to dashboard
      setTimeout(() => router.push("/dashboard"), 2200);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold mb-3">
            {householdName} is all set!
          </h1>
          <p className="text-white/60 text-lg">
            Taking you to your dashboard…
          </p>
        </div>
      </main>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-700 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/images/logo.png"
          alt="The House Ledger"
          width={180}
          height={60}
          className="w-auto h-12 object-contain brightness-0 invert opacity-90"
          priority
        />
      </div>

      <div className="w-full max-w-xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-brand-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step header */}
          <div className="px-8 pt-6 pb-2 flex items-center justify-between">
            {/* Step pills */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    i === step
                      ? "bg-brand-600 text-white"
                      : i < step
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <span className="text-sm leading-none">
                    {i < step ? "✓" : s.icon}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400 shrink-0 ml-2">
              {step + 1} of {STEPS.length}
            </span>
          </div>

          {/* Step content */}
          <div className="px-8 py-6">
            {/* ─── Step 0: Household ───────────────────────────── */}
            {step === 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Name your household</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    This is shown to your house manager and family members.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Household name <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="input text-lg"
                      placeholder="The Smith Household"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Home address <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      className="input"
                      placeholder="123 Main St, Anytown, USA"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Used for the house profile. Only visible to your household.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 1: Family ──────────────────────────────── */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Invite family members</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Family members can view the house profile, chat, see tasks, and track inventory.
                    They can&apos;t edit settings or billing.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {familyEmails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="email"
                        className="input flex-1"
                        placeholder={`family${i + 1}@example.com`}
                        value={email}
                        onChange={(e) => updateFamilyEmail(i, e.target.value)}
                      />
                      {familyEmails.length > 1 && (
                        <button
                          onClick={() => removeFamilyEmail(i)}
                          className="text-slate-400 hover:text-red-400 transition px-2"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFamilyEmail}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5 mt-1"
                  >
                    <span className="text-lg leading-none">+</span> Add another family member
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-4 bg-slate-50 rounded-lg px-3 py-2">
                  💡 Don&apos;t worry if you&apos;re not ready — you can invite family from <strong>Settings</strong> at any time.
                </p>
              </div>
            )}

            {/* ─── Step 2: House Manager ───────────────────────── */}
            {step === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Invite your house manager</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Your house manager handles day-to-day tasks, logs their hours, and keeps your
                    home running smoothly.
                  </p>
                </div>

                {/* What managers do */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { icon: "✅", text: "Completes tasks" },
                    { icon: "⏱️", text: "Tracks hours" },
                    { icon: "📦", text: "Manages inventory" },
                  ].map((item) => (
                    <div key={item.text} className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <p className="text-xs text-slate-600 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    House manager&apos;s email <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="manager@example.com"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                  />
                </div>

                <p className="text-xs text-slate-400 mt-3 bg-slate-50 rounded-lg px-3 py-2">
                  💡 Don&apos;t have one yet? You can invite them later via the{" "}
                  <strong>Hire a House Manager</strong> page.
                </p>
              </div>
            )}

            {/* ─── Step 3: Work Schedule ───────────────────────── */}
            {step === 3 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Set the work schedule</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    This tells your house manager which days and hours they&apos;re expected to work.
                    You can adjust this anytime in Settings.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Work days</label>
                    <div className="flex gap-2">
                      {DAYS.map((d, i) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`w-10 h-10 rounded-xl text-xs font-semibold transition border ${
                            workDays.includes(i)
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-white text-slate-500 border-slate-200 hover:border-brand-300"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Start time</label>
                      <input
                        type="time"
                        className="input"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">End time</label>
                      <input
                        type="time"
                        className="input"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 4: Starter Tasks ───────────────────────── */}
            {step === 4 && (
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-slate-900">Add a starter task pack?</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Get going immediately with pre-built daily, weekly, and monthly tasks for your
                    household. You can edit or remove any of them after setup.
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => setIncludeStarterTasks(!includeStarterTasks)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition mb-4 ${
                    includeStarterTasks
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition shrink-0 ${includeStarterTasks ? "bg-brand-600 border-brand-600" : "border-slate-300"}`}>
                      {includeStarterTasks && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Yes, include the starter task pack</p>
                      <p className="text-xs text-slate-500">5 daily + 7 weekly + 3 monthly tasks</p>
                    </div>
                  </div>
                </button>

                {/* Task preview */}
                {includeStarterTasks && (
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_TASKS.map((t) => (
                      <div key={t.title} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{t.title}</p>
                          <p className="text-xs text-slate-400">{t.freq}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5 col-span-2">
                      <span className="text-xl shrink-0">📋</span>
                      <p className="text-xs text-slate-500">+ many more daily, weekly &amp; monthly tasks…</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mt-4">
                {error}
              </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={back} className="btn-secondary">
                  ← Back
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button onClick={next} className="btn-primary flex-1">
                  Continue →
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="btn-primary flex-1 text-base py-3"
                >
                  {loading ? "Setting up your household…" : "🏠 Launch my household!"}
                </button>
              )}
            </div>

            {/* Skip hint for optional steps */}
            {step > 0 && step < STEPS.length - 1 && STEPS[step].optional && (
              <p className="text-center text-xs text-slate-400 mt-3">
                This step is optional —{" "}
                <button
                  onClick={next}
                  className="text-brand-600 hover:underline font-medium"
                >
                  skip for now
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          The House Ledger · All changes can be edited after setup
        </p>
        <p className="text-center text-white/30 text-xs mt-2">
          Wrong account?{" "}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-white/50 hover:text-white underline transition"
          >
            Sign out
          </button>
        </p>
      </div>
    </main>
  );
}
