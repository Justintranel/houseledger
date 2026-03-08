import Link from "next/link";
import Image from "next/image";

const MODULES = [
  {
    icon: "📅", title: "Task Calendar & Recurrence",
    details: [
      "Daily, weekly, monthly, seasonal, and custom recurrence rules",
      "Manager 'Today' checklist view + weekly calendar",
      "Owner calendar with full history scrollback",
      "One-off tasks for specific dates",
      "Comments on individual task instances",
      "Edit rules going-forward only — past history preserved",
    ],
  },
  {
    icon: "💬", title: "Household Chat",
    details: [
      "Channels within your household (default: #house-chat)",
      "Direct messages between any two members",
      "Real-time delivery via Socket.IO",
      "Typing indicators",
    ],
  },
  {
    icon: "📝", title: "Notes & Questions",
    details: [
      "Daily notes by date (shared or owner-private)",
      "Manager submits questions; owner answers",
      "Open/Answered status tracking",
    ],
  },
  {
    icon: "📦", title: "Inventory Tracking",
    details: [
      "Track any item with quantity, unit, and threshold",
      "Manager adjusts quantities with a note",
      "Low-stock indicators when below threshold",
      "Full adjustment history log",
    ],
  },
  {
    icon: "💳", title: "Purchase Approvals & Receipts",
    details: [
      "Manager submits purchase requests with amount, vendor, category, reason",
      "Auto-approve under household threshold; require approval over limit",
      "Owner approves or denies with reason",
      "Upload receipts (PDF/image) linked to requests",
      "Export month's receipts as CSV",
    ],
  },
  {
    icon: "🏠", title: "House Profile (100 Questions)",
    details: [
      "Pre-seeded question library: General, Utilities, HVAC, Appliances, Security, Emergency",
      "Owner fills answers in a guided form",
      "Manager gets read access; owner-only questions are hidden from manager",
    ],
  },
  {
    icon: "🔨", title: "Vendor Directory",
    details: [
      "Store vendor name, type, phone, email, notes",
      "Set per-vendor spending approval limits",
      "Link vendors to purchase requests",
    ],
  },
  {
    icon: "⏱️", title: "Time Tracking & Pay",
    details: [
      "Manager logs daily hours: start, end, break minutes",
      "Owner approves or rejects time entries",
      "Household hourly rate → automatic pay-owed calculation",
      "Export timesheets as CSV by date range",
    ],
  },
  {
    icon: "📄", title: "Contracts & E-sign",
    details: [
      "Upload contract PDFs",
      "Send for signature via e-sign provider (pluggable adapter)",
      "Track DRAFT → SENT → SIGNED → VOID status",
      "Full audit trail for every action",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <Image src="/images/logo.png" alt="The House Ledger" width={140} height={46} className="h-8 w-auto object-contain" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/features" className="text-brand-600 font-medium">Features</Link>
            <Link href="/pricing" className="hover:text-brand-600 transition">Pricing</Link>
            <Link href="/blog" className="hover:text-brand-600 transition">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 text-center">All Features</h1>
        <p className="text-slate-500 text-center mb-14">Everything included in your subscription. One plan, no surprises.</p>

        <div className="space-y-10">
          {MODULES.map((m) => (
            <div key={m.title} className="card p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{m.icon}</span>
                <h2 className="text-xl font-bold text-slate-900">{m.title}</h2>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {m.details.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Start your household →
          </Link>
        </div>
      </div>
    </div>
  );
}
