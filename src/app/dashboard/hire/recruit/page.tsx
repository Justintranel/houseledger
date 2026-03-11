"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

const SECTIONS = [
  {
    title: "🏠 About Your Home",
    questions: [
      "What is the full address of the property?",
      "Approximately how many square feet is the home?",
      "How many bedrooms and bathrooms?",
      "Do you have additional properties that may also require management? If yes, please describe.",
      "What unique features does your home have? (e.g. pool, guest house, gym, wine cellar, smart home systems, tennis court)",
    ],
  },
  {
    title: "👤 Your Current Situation",
    questions: [
      "Have you ever had a house manager or household staff before?",
      "If yes — what worked well, and what didn't?",
      "Are you currently without a manager, or are you replacing someone? What happened?",
      "When do you ideally need someone to start?",
      "How many hours per week are you envisioning for this role?",
    ],
  },
  {
    title: "📋 Role Scope & Responsibilities",
    questions: [
      "What are the primary responsibilities for this position? (Please be as specific as possible)",
      "Describe a typical day in your household.",
      "Will this person manage other household staff? If so, how many and what roles?",
      "Will they be responsible for driving? (personal vehicles, errands, airport runs)",
      "Will they handle pet care? If yes, describe your pets.",
      "Will they coordinate childcare or interact regularly with children?",
      "Do you need them to travel with you? If yes, how frequently and to what destinations?",
      "Will they be responsible for managing vendor relationships and service appointments?",
    ],
  },
  {
    title: "📅 Schedule & Availability",
    questions: [
      "What days and hours would you expect the manager to work?",
      "Is there flexibility in the schedule, or are set hours required?",
      "Will this be a live-in or live-out position?",
      "If live-in, describe the accommodation (private suite, guest house, etc.)",
      "Will they need to be on-call outside of regular hours? How often?",
    ],
  },
  {
    title: "🎓 Qualifications & Experience",
    questions: [
      "What level of experience are you looking for? (e.g. 2+ years, 5+ years, estate-level experience)",
      "Are there specific certifications or skills required? (e.g. CPR, culinary, estate management training)",
      "What languages must they speak? Any other language skills that would be a bonus?",
      "Do you prefer someone with formal household management training or is on-the-job experience sufficient?",
    ],
  },
  {
    title: "💰 Compensation & Benefits",
    questions: [
      "What is your target salary or hourly rate range for this position?",
      "Are you offering benefits? (health insurance, dental, vision, paid time off)",
      "Are you providing a housing stipend or accommodations if live-in?",
      "Are there performance bonuses or any other compensation components?",
    ],
  },
  {
    title: "🌟 Personality & Culture Fit",
    questions: [
      "How would you describe your household's atmosphere and pace? (e.g. formal, relaxed, high-energy, quiet)",
      "What personality traits are most important to you in this role?",
      "How do you prefer to communicate with your house manager? (daily check-ins, weekly meeting, app-based, minimal oversight)",
      "Describe your ideal house manager in 3 words.",
      "Are there any deal-breakers or absolute non-negotiables for this role?",
      "Is there anything else about your household, lifestyle, or expectations that would help us find the right person?",
    ],
  },
];

export default function RecruitForMePage() {
  const { data: session } = useSession();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setAnswer(question: string, value: string) {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  }

  // Count filled questions
  const totalQuestions = SECTIONS.flatMap((s) => s.questions).length;
  const answeredQuestions = Object.values(answers).filter((v) => v.trim()).length;
  const pct = Math.round((answeredQuestions / totalQuestions) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Require at least 20 answers
    if (answeredQuestions < 20) {
      setError("Please answer at least 20 questions so we can find the best match for you.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/recruit-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: answers,
          ownerName: (session?.user as any)?.name ?? "Owner",
          ownerEmail: session?.user?.email ?? "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to Stripe
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Recruit For Me</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tell us about your household and we'll find, screen, and place your ideal house manager.
        </p>
      </div>

      {/* Service overview card */}
      <div className="card p-6 mb-8 bg-gradient-to-br from-brand-50 to-white border border-brand-200">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔍</span>
              <h2 className="text-lg font-bold text-brand-900">Done-For-You Placement — $5,000</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              We handle everything from sourcing and screening to background checks and offer negotiation.
              Most placements are completed within <strong>4–6 weeks</strong>.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "✅ Candidate sourcing from our vetted network",
                "✅ Full background & reference checks",
                "✅ Interview coordination & facilitation",
                "✅ Offer negotiation & onboarding support",
                "✅ Satisfaction guarantee — we re-place if needed",
                "✅ Dedicated placement coordinator",
              ].map((item) => (
                <p key={item} className="text-xs text-slate-600">{item}</p>
              ))}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-3xl font-bold text-brand-700">$5,000</div>
            <div className="text-xs text-slate-400 mt-1">one-time placement fee</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5 pt-4 border-t border-brand-200">
          <p className="text-xs font-semibold text-brand-700 mb-2">⏱ What to expect</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            {[
              { week: "Week 1", label: "Intake & sourcing kickoff" },
              { week: "Weeks 2–3", label: "Screening & interviews" },
              { week: "Weeks 4–5", label: "Background checks & references" },
              { week: "Week 6", label: "Offer, hire & onboarding" },
            ].map((step, i) => (
              <div key={i} className="flex sm:flex-col items-center gap-2 sm:gap-1 flex-1 text-center">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-800">{step.week}</p>
                  <p className="text-xs text-slate-500">{step.label}</p>
                </div>
                {i < 3 && <div className="hidden sm:block flex-1 h-px bg-brand-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-slate-700">Form progress</p>
          <p className="text-sm text-slate-500">{answeredQuestions} / {totalQuestions} questions answered</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title} className="card p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
              {section.title}
            </h3>
            {section.questions.map((q) => (
              <div key={q}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{q}</label>
                <textarea
                  value={answers[q] ?? ""}
                  onChange={(e) => setAnswer(q, e.target.value)}
                  rows={2}
                  className="input w-full resize-y text-sm"
                  placeholder="Your answer…"
                />
              </div>
            ))}
          </div>
        ))}

        {/* Submit */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Ready to get started?</h3>
          <p className="text-sm text-slate-500 mb-5">
            After submitting your form, you'll be taken to our secure payment page to complete your $5,000 placement deposit.
            Our team will contact you within 1 business day to kick off your search.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full sm:w-auto text-sm px-8 py-3 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Preparing checkout…
              </>
            ) : (
              <>🔐 Submit & Pay $5,000 Securely</>
            )}
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Secured by Stripe. Your answers are sent to our team immediately.
          </p>
        </div>
      </form>
    </div>
  );
}
