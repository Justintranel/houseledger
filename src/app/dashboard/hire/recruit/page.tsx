import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Recruit For Me" };

export default async function RecruitForMePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as any).role as string;
  if (role !== "OWNER") redirect("/dashboard");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Recruit For Me</h1>
        <p className="text-slate-500 text-sm mt-1">
          Let us find, vet, and place the right house manager for your household.
        </p>
      </div>

      {/* Hero card */}
      <div className="card p-8 mb-6 bg-gradient-to-br from-brand-50 to-white border border-brand-200">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-brand-900 mb-2">
          Done-For-You House Manager Placement
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Finding the right house manager takes time — screening candidates, checking references,
          negotiating compensation, and onboarding. We handle all of it so you don't have to.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: "✅", title: "Candidate Sourcing", desc: "We tap our vetted network of experienced household professionals." },
            { icon: "🔒", title: "Background Checks", desc: "Full background, reference, and employment history verification." },
            { icon: "🤝", title: "Interview Coordination", desc: "We schedule and facilitate interviews with your top candidates." },
            { icon: "📄", title: "Offer & Onboarding", desc: "We help structure the offer, contract, and first-week onboarding plan." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="mailto:support@thehouseledger.com?subject=Recruit%20For%20Me%20%E2%80%94%20House%20Manager%20Placement"
          className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-3"
        >
          <span>✉️</span> Get Started — Contact Us
        </a>
        <p className="text-xs text-slate-400 mt-3">
          Our team will reach out within 1 business day to discuss your household's needs.
        </p>
      </div>

      {/* FAQ */}
      <div className="card p-6 space-y-5">
        <h3 className="text-base font-semibold text-slate-800">Frequently Asked Questions</h3>
        {[
          {
            q: "How long does placement typically take?",
            a: "Most placements are completed within 2–4 weeks from initial consultation to first day of work.",
          },
          {
            q: "What types of roles can you recruit for?",
            a: "House managers, estate managers, personal assistants, household couples, and executive housekeepers.",
          },
          {
            q: "Is there a placement fee?",
            a: "Yes — pricing is discussed during your initial consultation and varies based on role type and household scope.",
          },
          {
            q: "What if the placement isn't a good fit?",
            a: "We offer a guarantee period. If the placement doesn't work out within the guarantee window, we'll find a replacement at no additional charge.",
          },
        ].map((item) => (
          <div key={item.q} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <p className="text-sm font-semibold text-slate-800 mb-1">{item.q}</p>
            <p className="text-sm text-slate-500">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
