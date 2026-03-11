import Link from "next/link";

export const metadata = { title: "Recruitment Request Submitted" };

export default function RecruitSuccessPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="card p-10 text-center">
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          You're all set — we're on it!
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto">
          Your payment and intake form have been received. Our placement team will reach out within
          <strong> 1 business day</strong> to review your responses and kick off your search.
        </p>

        {/* Timeline */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-8 text-left">
          <p className="text-sm font-bold text-brand-800 mb-3">Your placement timeline</p>
          <ul className="space-y-2.5">
            {[
              { icon: "📞", step: "Week 1", detail: "Intake call with your placement coordinator + candidate sourcing begins" },
              { icon: "🔍", step: "Weeks 2–3", detail: "Candidate screening, interviews, and shortlist delivered to you" },
              { icon: "✅", step: "Weeks 4–5", detail: "Full background checks, reference verification, and final selection" },
              { icon: "🤝", step: "Week 6", detail: "Offer, contract signing, and first-day onboarding support" },
            ].map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <span className="text-xs font-bold text-brand-700">{item.step} — </span>
                  <span className="text-xs text-slate-600">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8 text-left">
          <p className="text-xs font-semibold text-green-700 mb-1">📧 Check your email</p>
          <p className="text-xs text-green-700">
            A confirmation has been sent to your inbox. Our placement coordinator will follow up within 1 business day.
          </p>
        </div>

        <Link href="/dashboard" className="btn-primary text-sm px-8 py-3 inline-flex">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
