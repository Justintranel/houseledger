"use client";
import { useState, useRef } from "react";
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
  const errorRef = useRef<HTMLDivElement>(null);

  function setAnswer(question: string, value: string) {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  }

  const totalQuestions = SECTIONS.flatMap((s) => s.questions).length;
  const answeredQuestions = Object.values(answers).filter((v) => v.trim()).length;
  const pct = Math.round((answeredQuestions / totalQuestions) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (answeredQuestions < 10) {
      const msg = "Please answer at least 10 questions so we can find the best match for your household.";
      setError(msg);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
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
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Recruitment Done For You</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tell us about your household and we'll find, screen, and place your ideal house manager.
        </p>
      </div>

      {/* Self-hire note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-1">💡 Did you know?</p>
        <p className="text-sm text-amber-700 leading-relaxed">
          Over <strong>50% of our members successfully recruit their own house manager</strong> using the step-by-step process under{" "}
          <a href="/dashboard/hire" className="underline font-semibold hover:text-amber-900">
            Hire Manager
          </a>
          . Our done-for-you recruitment is ideal for owners who want the entire search handled professionally — but it is{" "}
          <strong>not a staffing agency</strong>. We manage the sourcing, vetting, and placement process on your behalf.
        </p>
      </div>

      {/* Video placeholder */}
      <div className="card mb-6 overflow-hidden">
        <div className="bg-slate-900 aspect-video flex flex-col items-center justify-center gap-3 rounded-t-xl">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">Video coming soon — How Recruitment Done For You works</p>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Upload your explainer video here to walk owners through the recruitment process.
          </p>
        </div>
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
          <div className="sm:text-right shrink-0">
            <div className="text-3xl font-bold text-brand-700">$5,000</div>
            <div className="text-xs text-slate-400 mt-1">one-time placement fee</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5 pt-4 border-t border-brand-200">
          <p className="text-xs font-semibold text-brand-700 mb-3">⏱ What to expect — 4 to 6 weeks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { week: "Week 1", label: "Intake & sourcing kickoff" },
              { week: "Weeks 2–3", label: "Screening & interviews" },
              { week: "Weeks 4–5", label: "Background & references" },
              { week: "Week 6", label: "Offer, hire & onboarding" },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-lg border border-brand-200 px-3 py-2.5 text-center">
                <div className="text-xs font-bold text-brand-700">{step.week}</div>
                <div className="text-xs text-slate-500 mt-0.5">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-slate-700">Intake form progress</p>
          <p className="text-sm text-slate-500">{answeredQuestions} / {totalQuestions} answered</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {answeredQuestions < 10 && (
          <p className="text-xs text-slate-400 mt-1">Answer at least 10 questions to submit.</p>
        )}
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

          <div ref={errorRef}>
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg px-4 py-3 font-medium">
                ⚠️ {error}
              </div>
            )}
          </div>

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
            Secured by Stripe. Your answers are sent to our team immediately upon payment.
          </p>
        </div>
      </form>
    </div>
  );
}
