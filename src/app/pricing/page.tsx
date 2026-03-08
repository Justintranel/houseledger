import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  "Unlimited tasks & calendar",
  "House manager + unlimited family members",
  "Real-time chat (channels & direct messages)",
  "House Profile — 100+ question knowledge base",
  "House SOPs — room-by-room instructions & photos",
  "Inventory tracking & shopping list",
  "Purchase approvals & receipt storage",
  "Time tracking & payroll exports",
  "Contract e-sign (internal signature app)",
  "Vendor directory & notes",
  "All House Ledger materials included",
  "7-day free trial (card required)",
  "Priority email support",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <Image src="/images/logo.png" alt="The House Ledger" width={140} height={46} className="h-8 w-auto object-contain" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/features" className="hover:text-brand-600 transition">Features</Link>
            <Link href="/pricing" className="text-brand-600 font-medium">Pricing</Link>
            <Link href="/blog" className="hover:text-brand-600 transition">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Simple, All-Inclusive Pricing</h1>
          <p className="text-slate-500 text-lg">One plan. Everything included. No options, no surprises.</p>
        </div>

        <div className="card p-10 border-brand-600 ring-2 ring-brand-600">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-4">
              ✨ Used by 200+ Homeowners &amp; 200+ House Managers
            </div>
            <h2 className="text-2xl font-bold text-slate-900">The House Ledger System</h2>
            <p className="text-slate-500 text-sm mt-1 mb-4">The software that helps you manage your house manager.</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-6xl font-bold text-brand-600">$99</span>
              <span className="text-slate-400 pb-2">/month</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">Per household · Cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-slate-700">
                <span className="text-emerald-500 shrink-0 font-bold text-base">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link href="/signup" className="btn-primary w-full text-center block py-4 text-base font-semibold">
            Start Your Free Trial →
          </Link>
          <p className="text-center text-xs text-slate-400 mt-3">7-day free trial · Card required · Cancel before trial ends to pay nothing</p>
        </div>

        <div className="mt-10 text-center space-y-3 text-sm text-slate-400">
          <p>Questions? <a href="mailto:hello@thehouseledger.com" className="text-brand-600 underline hover:text-brand-800">hello@thehouseledger.com</a></p>
          <p>All House Ledger materials are included with your subscription.</p>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Pricing FAQ</h3>
          {[
            { q: "Is there just one plan?", a: "Yes. We believe the House Ledger System works best as one complete package. Every subscriber gets everything — all nine modules, all House Ledger materials, and unlimited household members." },
            { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your account settings. There are no long-term contracts or cancellation fees." },
            { q: "Are there per-seat fees?", a: "No. $99/month covers your entire household — owner, house manager, and family members." },
            { q: "What happens after the free trial?", a: "After 7 days, your card is automatically charged $99/month. You can cancel anytime before the trial ends to pay nothing." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-slate-200 py-4">
              <p className="font-semibold text-slate-900 mb-1 text-sm">{q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} House Ledger Software. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <Link href="/features" className="hover:text-slate-600">Features</Link>
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
