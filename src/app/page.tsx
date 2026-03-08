import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  { icon: "📅", title: "Task Management", desc: "Assign recurring daily, weekly, monthly, and seasonal tasks. Your manager checks them off — you see it all in real time." },
  { icon: "💬", title: "Direct Communication", desc: "Built-in channels and direct messaging so you and your house manager are always in sync." },
  { icon: "🏡", title: "House Profile", desc: "A 100+ question knowledge base covering appliances, utilities, emergency contacts, insurance, and more." },
  { icon: "📖", title: "House SOPs", desc: "Room-by-room standard operating procedures with detailed notes and reference photos for each area of your home." },
  { icon: "📦", title: "Inventory & Shopping", desc: "Track supplies with low-stock alerts. Set product links so your manager can reorder with one click." },
  { icon: "💳", title: "Purchase Approvals", desc: "Set spending thresholds, approve requests from your phone, and keep every receipt on file." },
  { icon: "⏱️", title: "Time Tracking", desc: "Your house manager clocks in and out. Track hours worked, calculate pay, and export timesheets." },
  { icon: "📄", title: "Contracts & E-Sign", desc: "Create contract templates, send for internal signature, and manage signed agreements — all in your portal." },
  { icon: "🔨", title: "Vendor Directory", desc: "Keep all your approved vendors — plumbers, cleaners, landscapers — organized with contacts and spending limits." },
];

const TESTIMONIALS = [
  {
    quote: "The House Ledger System completely changed how I manage my home. My house manager and I are finally on the same page.",
    name: "Sarah M.",
    title: "Homeowner",
  },
  {
    quote: "As a house manager, this gives me everything I need in one place. Tasks, notes, and chat make my job so much easier.",
    name: "Jamie L.",
    title: "House Manager",
  },
  {
    quote: "I used to spend so much time coordinating. Now everything is in the system and it just works.",
    name: "Michael R.",
    title: "Estate Owner",
  },
];

const ALL_FEATURES = [
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
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <Image src="/images/logo.png" alt="The House Ledger" width={140} height={46} className="h-8 w-auto object-contain" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/features" className="hover:text-brand-600 transition">Features</Link>
            <Link href="/pricing" className="hover:text-brand-600 transition">Pricing</Link>
            <Link href="/blog" className="hover:text-brand-600 transition">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold mb-6">
              ✨ Used by 200+ Homeowners &amp; 200+ House Managers
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              The Software That Helps You<br />
              <span className="text-brand-600">Manage Your House Manager.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-4">
              The House Ledger System is a private portal connecting homeowners with their household managers — built around the trusted House Ledger methodology.
            </p>
            <p className="text-lg text-slate-400 mb-8">
              Tasks, communication, approvals, time tracking, contracts, and your complete house knowledge base — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <Link href="/signup" className="btn-primary text-base px-8 py-3">
                Start Your Household →
              </Link>
              <Link href="/features" className="btn-secondary text-base px-8 py-3">
                See All Features
              </Link>
            </div>
            <p className="text-sm text-slate-400">
              All House Ledger materials included · $99/month · Cancel anytime
            </p>
          </div>

          {/* Right — Branded logo panel */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-brand-900 flex flex-col items-center justify-center" style={{ height: "520px" }}>
              {/* Subtle decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className="w-[480px] h-[480px] rounded-full border border-white/5 absolute" />
                <div className="w-[360px] h-[360px] rounded-full border border-white/5 absolute" />
                <div className="w-[240px] h-[240px] rounded-full border border-white/5 absolute" />
              </div>
              {/* Logo */}
              <Image
                src="/images/logo.png"
                alt="The House Ledger"
                width={320}
                height={104}
                className="w-72 h-auto object-contain brightness-0 invert relative z-10"
                priority
              />
              <p className="text-white/40 text-sm tracking-widest uppercase mt-6 relative z-10">
                Home Management Software
              </p>
            </div>
            {/* Floating stat badge */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-4 border border-slate-100">
              <p className="text-2xl font-bold text-brand-600">400+</p>
              <p className="text-xs text-slate-500 font-medium leading-snug">Homeowners &amp; Managers<br />using the system</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className="bg-brand-900 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "200+", label: "Homeowners" },
              { number: "200+", label: "House Managers" },
              { number: "10,000+", label: "Tasks Completed" },
              { number: "All", label: "House Ledger Materials Included" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white mb-1">{s.number}</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo + Value Props ── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Photo */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ height: "580px" }}>
              {/* Photo — save your image to /public/images/manager-desk.jpg */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/manager-desk.jpg"
                alt="House Manager at desk"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 -z-10 flex items-center justify-center" aria-hidden="true">
                <span className="text-7xl">🏡</span>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              The Complete System for Managing Your Home Manager
            </h2>
            <div className="space-y-6">
              {[
                {
                  icon: "📋",
                  title: "Set expectations clearly",
                  desc: "Assign tasks with recurrence rules so your manager always knows what needs to be done and when.",
                },
                {
                  icon: "🏡",
                  title: "Document your home completely",
                  desc: "Your House Profile and SOPs give your manager every detail they need — from appliance manuals to pool maintenance procedures.",
                },
                {
                  icon: "💬",
                  title: "Communicate without confusion",
                  desc: "Built-in messaging replaces scattered texts and emails. Everything is in one private portal.",
                },
                {
                  icon: "💰",
                  title: "Stay in control of spending",
                  desc: "Approve purchases, track hours worked, manage contracts — all with full visibility.",
                },
              ].map((v) => (
                <div key={v.title} className="flex gap-4">
                  <span className="text-2xl shrink-0 mt-0.5">{v.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">{v.title}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything in One System</h2>
            <p className="text-slate-500 text-lg">Nine powerful modules. One clean dashboard. All House Ledger materials included.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: "1", title: "Sign up in minutes", desc: "Create your household portal and invite your house manager and family members." },
            { step: "2", title: "Set up your home", desc: "Fill in your House Profile, add SOPs for each room, assign recurring tasks, and configure your preferences." },
            { step: "3", title: "Run it daily", desc: "Your manager checks off tasks, logs time, and messages you — all in one professional system." },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white text-xl font-bold flex items-center justify-center mb-4">{s.step}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-brand-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">What Our Members Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map((i) => <span key={i} className="text-amber-400">★</span>)}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Simple, All-Inclusive Pricing</h2>
          <p className="text-slate-500 mb-10">One price. Unlimited members. Everything included. No options needed.</p>

          <div className="card p-8 border-brand-600 ring-2 ring-brand-600 text-left">
            <div className="text-center mb-6">
              <p className="text-xl font-bold text-slate-900 mb-1">The House Ledger System</p>
              <div className="flex items-end justify-center gap-1 mt-3">
                <span className="text-5xl font-bold text-brand-600">$99</span>
                <span className="text-slate-400 text-sm pb-2">/month</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">Per household · Cancel anytime</p>
            </div>

            <ul className="space-y-3 mb-8">
              {ALL_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-slate-700">
                  <span className="text-emerald-500 shrink-0 font-bold">✓</span>{f}
                </li>
              ))}
            </ul>

            <Link href="/signup" className="btn-primary w-full text-center block py-3.5 text-base">
              Get Started Today →
            </Link>
            <p className="text-xs text-slate-400 text-center mt-3">14-day free trial included · No credit card required to start</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">Frequently Asked Questions</h2>
          {[
            { q: "Who is The House Ledger System for?", a: "Homeowners who employ household managers, housekeepers, or estate managers. It gives both parties a shared professional workspace built around the House Ledger methodology." },
            { q: "What is included with my subscription?", a: "Everything — all nine modules, unlimited household members, and all House Ledger materials. There are no add-ons or per-seat fees. Just $99/month." },
            { q: "Is my household data private?", a: "Yes. Each household is fully isolated. Your data is never shared with other households or third parties." },
            { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your billing settings. Your data is retained for 30 days after cancellation." },
            { q: "How do I get my house manager set up?", a: "After signing up, go to Settings → Workers & Rates and invite your manager by email. They'll get access to their portal immediately." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-slate-200 py-5">
              <p className="font-semibold text-slate-900 mb-1">{q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-900 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take Control of Your Home?</h2>
          <p className="text-brand-200 mb-8 text-lg">
            Join 200+ homeowners and house managers using The House Ledger System.
          </p>
          <Link href="/signup" className="inline-block bg-white text-brand-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-brand-50 transition shadow-lg">
            Start Your Free Trial →
          </Link>
          <p className="text-brand-300 text-sm mt-4">$99/month after trial · No contracts · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            <Image src="/images/logo.png" alt="The House Ledger" width={120} height={40} className="h-7 w-auto object-contain mb-1" />
            <p>© {new Date().getFullYear()} House Ledger Software. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/features" className="hover:text-slate-600">Features</Link>
            <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
