"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface TourStep {
  icon: string;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  /** Only show this step to these roles. Null/absent = all roles. */
  roles?: string[];
  /** Optional tip box shown below description */
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: "🏠",
    title: "Welcome to The House Ledger",
    description:
      "Your all-in-one household management system. This 2-minute tour covers every feature so you can hit the ground running. You can replay it any time from your profile.",
    tip: "Use the arrows to step through, or click 'Skip tour' to jump straight in.",
  },
  {
    icon: "🏡",
    title: "House Profile",
    description:
      "Document your home's key details — address, notes, and important references. This becomes the central record for your entire household team.",
    href: "/dashboard/profile",
    linkLabel: "Open House Profile →",
    roles: ["OWNER", "FAMILY"],
  },
  {
    icon: "📋",
    title: "Task Management",
    description:
      "Create recurring or one-time tasks for your house manager. Set categories, assign due dates, and track every to-do. Your manager sees their work queue in the 'Today' view.",
    href: "/dashboard/tasks",
    linkLabel: "Open Tasks →",
    roles: ["OWNER", "FAMILY"],
  },
  {
    icon: "✅",
    title: "Today's Tasks",
    description:
      "Your daily work queue — tasks assigned by your employer, checked off as you go. Start each shift here to see exactly what needs to get done.",
    href: "/dashboard/today",
    linkLabel: "Open Today →",
    roles: ["MANAGER"],
  },
  {
    icon: "💬",
    title: "Real-Time Chat",
    description:
      "Direct messaging between owner and house manager. Get updates, share photos, and communicate without phone tag. Every message is logged for your records.",
    href: "/dashboard/chat",
    linkLabel: "Open Chat →",
  },
  {
    icon: "📝",
    title: "Notes",
    description:
      "A shared notepad for access codes, vendor contacts, house rules, and anything your team needs to reference. Organized, searchable, and always available.",
    href: "/dashboard/notes",
    linkLabel: "Open Notes →",
  },
  {
    icon: "📦",
    title: "Inventory Tracking",
    description:
      "Track household supplies, appliances, furniture, and valuables. Log serial numbers, warranty info, and reorder points so nothing falls through the cracks.",
    href: "/dashboard/inventory",
    linkLabel: "Open Inventory →",
  },
  {
    icon: "💳",
    title: "Approvals",
    description:
      "Managers can submit expenses and purchase requests for owner approval. Everything has a paper trail — amounts, receipts, decisions, and dates.",
    href: "/dashboard/approvals",
    linkLabel: "Open Approvals →",
  },
  {
    icon: "🍽️",
    title: "Meal Planner",
    description:
      "Plan weekly menus and share them with your household team. Your house manager can prep groceries and meals in advance — no more daily 'what's for dinner?' questions.",
    href: "/dashboard/meals",
    linkLabel: "Open Meal Planner →",
  },
  {
    icon: "📅",
    title: "Family Calendar",
    description:
      "Coordinate household events, appointments, travel, and schedules in one shared calendar so your team can plan around your family's life.",
    href: "/dashboard/calendar",
    linkLabel: "Open Calendar →",
  },
  {
    icon: "🔩",
    title: "Maintenance Log",
    description:
      "Log repair requests, service calls, and maintenance history. Save trusted vendors with their contact info — never lose your plumber's number again.",
    href: "/dashboard/maintenance",
    linkLabel: "Open Maintenance →",
  },
  {
    icon: "⏱️",
    title: "Time Tracking",
    description:
      "Your house manager clocks in and out from the app. You review their hours and approve time entries. Every minute is tracked and audit-ready.",
    href: "/dashboard/time",
    linkLabel: "Open Timesheet →",
    roles: ["OWNER", "FAMILY"],
  },
  {
    icon: "💸",
    title: "Payroll",
    description:
      "Once time is approved, Payroll calculates exactly what you owe each worker. Then click 'Pay Now' to open Zelle, Venmo, PayPal, or Care.com HomePay — the easiest way to pay household staff compliantly.",
    href: "/dashboard/payroll",
    linkLabel: "Open Payroll →",
    roles: ["OWNER"],
    tip: "If you pay $2,600+ per year, you may need to file household employer taxes. Care.com HomePay handles this automatically.",
  },
  {
    icon: "📄",
    title: "Contracts",
    description:
      "Upload and store signed employment contracts, NDAs, and service agreements. Every document is organized by household member and date.",
    href: "/dashboard/contracts",
    linkLabel: "Open Contracts →",
    roles: ["OWNER", "FAMILY"],
  },
  {
    icon: "⭐",
    title: "Performance Reviews",
    description:
      "Run structured quarterly or annual reviews for your house manager. Track performance over time, document feedback, and set goals — all in one place.",
    href: "/dashboard/reviews",
    linkLabel: "Open Reviews →",
    roles: ["OWNER", "FAMILY"],
  },
  {
    icon: "📖",
    title: "House SOPs",
    description:
      "Document standard operating procedures for your home — opening/closing routines, emergency contacts, seasonal checklists. Your team always knows the protocol.",
    href: "/dashboard/sop",
    linkLabel: "Open SOPs →",
  },
  {
    icon: "🎓",
    title: "Training Videos",
    description:
      "A library of training resources for household staff. Share videos on proper cleaning techniques, household systems, and professional standards.",
    href: "/dashboard/training",
    linkLabel: "Open Training →",
  },
  {
    icon: "🤝",
    title: "Hire a House Manager",
    description:
      "Need to find your first house manager? We connect you with vetted, professional candidates in your area. Post your role and start reviewing applicants today.",
    href: "/dashboard/hire",
    linkLabel: "Start Hiring →",
    roles: ["OWNER"],
  },
  {
    icon: "🎉",
    title: "You're all set!",
    description:
      "Your household command center is ready. Start by filling out your House Profile and inviting your house manager from Settings → Workers & Rates.",
    tip: "💡 Pro tip: The Compliance section (Timesheet → Payroll) is where the real time savings are. Set it up on day one.",
  },
];

const STORAGE_KEY = "hl_tour_v1_seen";

interface Props {
  role: string;
}

export default function FeatureTour({ role }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable (SSR edge case)
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  // Filter steps for the current role
  const steps = TOUR_STEPS.filter((s) => !s.roles || s.roles.includes(role));
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  if (!visible || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {/* Backdrop click = skip */}
      <div className="absolute inset-0" onClick={dismiss} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-1.5 bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-8 pt-7 pb-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {step + 1} / {steps.length}
            </span>
            <button
              onClick={dismiss}
              className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
            >
              Skip tour <span aria-hidden>✕</span>
            </button>
          </div>

          {/* Feature icon + title */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-3" aria-hidden>
              {current.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {current.title}
            </h2>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed text-center mb-4">
            {current.description}
          </p>

          {/* Tip callout */}
          {current.tip && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-xs text-brand-700 text-center leading-relaxed mb-4">
              {current.tip}
            </div>
          )}

          {/* "Go there" link */}
          {current.href && (
            <div className="text-center mb-1">
              <Link
                href={current.href}
                onClick={dismiss}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline transition"
              >
                {current.linkLabel}
              </Link>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-8 pb-7 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className="text-sm text-slate-400 hover:text-slate-700 transition disabled:invisible"
          >
            ← Back
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  i === step ? "bg-brand-600 w-3" : "bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={dismiss}
              className="btn-primary text-sm px-5 py-2"
            >
              Let&apos;s go! 🎉
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary text-sm px-5 py-2"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
