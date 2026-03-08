"use client";

import { useState } from "react";

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    icon: "📋",
    title: "Define the Role",
    subtitle: "Know exactly what you need before you post",
    color: "bg-blue-50 border-blue-200",
    accent: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    content: [
      {
        heading: "Hours & Schedule",
        body: "Decide how many hours per week you need and what schedule works for your household. Most house managers work 20–40 hours per week. Be specific about start times, days, and whether live-in is required.",
      },
      {
        heading: "Core Responsibilities",
        body: "Write out every duty you expect — household management, errands, grocery shopping, coordinating vendors, overseeing repairs, supervising staff, and any specialty tasks (pet care, driving, etc.).",
      },
      {
        heading: "Budget",
        body: "Research fair market rates in your area. Hourly house managers typically range from $20–$45/hr depending on experience and responsibilities. Factor in employer taxes, paid time off, and any benefits you plan to offer.",
      },
      {
        heading: "Must-Have Qualities",
        body: "Write a short list of non-negotiables: reliable transportation, background-check ready, non-smoker, comfortable with pets, valid driver's license, etc. Having this ready makes screening much faster.",
      },
    ],
  },
  {
    id: 2,
    icon: "💻",
    title: "Set Up Your Care.com Profile",
    subtitle: "Create your employer account and post the job",
    color: "bg-emerald-50 border-emerald-200",
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    content: [
      {
        heading: "Step 1 — Create a Free Account",
        body: "Go to care.com and click \u201cFind Care.\u201d Select \u201cHousehold\u201d as your care type, then \u201cHousekeeping & Errands\u201d or \u201cNanny/Household Manager\u201d depending on your needs. Fill in your zip code and household size.",
        cta: { label: "Go to Care.com →", url: "https://www.care.com" },
      },
      {
        heading: "Step 2 — Complete Your Family Profile",
        body: "Upload a clear photo of your home (exterior works well). Write a warm but professional introduction — describe your family, the home, and what you value in household help. Profiles with photos and a complete bio get 3x more responses.",
      },
      {
        heading: "Step 3 — Post the Job",
        body: "Use the \u201cPost a Job\u201d feature. Title it clearly: \u201cExperienced House Manager \u2014 [City].\u201d In the description, include: weekly hours, specific duties, start date, compensation range, and your must-haves list from Step 1.",
      },
      {
        heading: "Step 4 — Set Your Budget",
        body: "Care.com offers free and premium membership tiers. A premium membership ($40–$50/month) unlocks full access to candidate profiles and background check tools — worth it for a full-time hire.",
      },
    ],
  },
  {
    id: 3,
    icon: "🔍",
    title: "Screen Candidates",
    subtitle: "Filter quickly, interview thoughtfully",
    color: "bg-amber-50 border-amber-200",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    content: [
      {
        heading: "Initial Review",
        body: "Review profiles and focus on: years of experience, whether they've worked in a household management role before (not just cleaning), their response time, and the quality of their reviews. Shortlist 5–8 candidates.",
      },
      {
        heading: "Phone Screen (15 minutes)",
        body: "Call your top candidates for a quick conversation. Ask: Why are you leaving your current position? What does a typical day look like for you? What's your experience with vendor coordination? This filters out poor communicators quickly.",
      },
      {
        heading: "In-Home Interview",
        body: "Invite your top 2–3 candidates for a walk-through of the home. Show them key areas, explain your expectations, and observe how they engage. Do they ask smart questions? Are they taking notes? Do they seem genuinely interested?",
      },
      {
        heading: "Reference Check",
        body: "Always call at least two previous employers directly. Ask: Would you rehire this person? Did they manage their time well without supervision? Were there any issues with trust or reliability? References from similar households carry the most weight.",
      },
    ],
  },
  {
    id: 4,
    icon: "✅",
    title: "Make the Hire",
    subtitle: "Background check, offer, and contract",
    color: "bg-purple-50 border-purple-200",
    accent: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    content: [
      {
        heading: "Background Check",
        body: "Run a background check before extending an offer. Care.com offers this through their platform, or use a service like Checkr or HireRight. At minimum, check criminal history and motor vehicle record (if driving is involved).",
      },
      {
        heading: "Make a Written Offer",
        body: "Send a formal written offer letter stating: job title, start date, hours, compensation, and any trial period terms (2 weeks is standard). This sets professional expectations from day one.",
      },
      {
        heading: "Sign a Contract",
        body: "Use The House Ledger System's Contracts feature to create and sign an employment agreement. Cover: duties, schedule, compensation, confidentiality, and notice period. Both parties should sign before the first day.",
      },
      {
        heading: "Set Up Payroll",
        body: "Household employees have specific tax requirements. Use a service like HomePay (by Care.com), SurePayroll, or GTM Payroll to handle withholding, W-2s, and quarterly filings — this protects both you and your employee.",
      },
    ],
  },
  {
    id: 5,
    icon: "🏠",
    title: "Onboard with The House Ledger",
    subtitle: "Get your new house manager up to speed fast",
    color: "bg-brand-50 border-brand-200",
    accent: "text-brand-600",
    badge: "bg-brand-100 text-brand-700",
    content: [
      {
        heading: "Invite Them to the Portal",
        body: "Go to Settings → Workers & Rates to add your new house manager. They'll receive an invite link to create their account. Once set up, they'll have immediate access to their tasks, the house SOPs, and your shared chat.",
      },
      {
        heading: "Complete the House Profile Together",
        body: "Schedule 1–2 hours in the first week to walk through the House Profile together. Answer every question — utilities, appliances, emergency contacts, vendor list, household preferences. This becomes their reference guide for everything.",
      },
      {
        heading: "Build Out the SOPs",
        body: "Walk through each room in the House SOPs section and fill in your expectations and standards. Add reference photos showing how each area should look when maintained properly. Your house manager now has a visual standard, not just verbal instructions.",
      },
      {
        heading: "Set Up Recurring Tasks",
        body: "Use the Task Calendar to build out your house manager's recurring schedule — daily, weekly, monthly, and seasonal tasks. A fully built task calendar means your house manager always knows what needs to happen without having to ask.",
      },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HirePage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Hire a House Manager</h1>
        <p className="text-slate-500 text-sm mt-1">
          A step-by-step guide to finding, hiring, and onboarding a professional house manager.
        </p>
      </div>

      {/* Intro card */}
      <div className="card p-5 mb-8 bg-brand-50 border-brand-200">
        <div className="flex gap-4">
          <span className="text-3xl shrink-0">👩‍💼</span>
          <div>
            <p className="font-semibold text-slate-900 mb-1">The House Ledger Hiring Process</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Follow these five steps to find a reliable, professional house manager — from defining the role
              through onboarding them into your House Ledger portal. For deeper training and our full hiring
              curriculum, visit the{" "}
              <a
                href="https://www.skool.com/thehouseledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-medium underline hover:text-brand-800"
              >
                House Ledger Community on Skool
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const isOpen = activeStep === step.id;
          return (
            <div
              key={step.id}
              className={`card overflow-hidden border ${step.color} transition-all`}
            >
              {/* Step header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-black/[.03] transition"
                onClick={() => setActiveStep(isOpen ? null : step.id)}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${step.badge}`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${step.accent}`}>
                      Step {step.id}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 leading-tight">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.subtitle}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Step content */}
              {isOpen && (
                <div className="border-t border-current/10 px-5 py-5 bg-white space-y-5">
                  {step.content.map((section) => (
                    <div key={section.heading}>
                      <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${step.badge} inline-block`} />
                        {section.heading}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
                      {"cta" in section && section.cta && (
                        <a
                          href={section.cta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition"
                        >
                          {section.cta.label}
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 card p-6 text-center border-brand-200 bg-brand-50">
        <p className="text-lg font-bold text-slate-900 mb-1">Want the full hiring training?</p>
        <p className="text-sm text-slate-500 mb-4">
          The House Ledger Community on Skool includes video training, templates, scripts, and a community of homeowners going through the same process.
        </p>
        <a
          href="https://www.skool.com/thehouseledger"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary px-6 py-2.5"
        >
          Join the Community →
        </a>
      </div>
    </div>
  );
}
