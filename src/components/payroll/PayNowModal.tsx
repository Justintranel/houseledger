"use client";

interface PayNowModalProps {
  workerName: string;
  workerEmail: string;
  totalCents: number;
  totalHours: number;
  onClose: () => void;
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const PAYMENT_OPTIONS = [
  {
    id: "zelle",
    icon: "💚",
    name: "Zelle",
    tagline: "Instant bank-to-bank transfer",
    description: "Free, fast, and available through most major US bank apps. No fees.",
    url: "https://www.zellepay.com",
    cta: "Open Zelle",
    color: "border-purple-200 hover:border-purple-400",
    badge: null,
  },
  {
    id: "venmo",
    icon: "💙",
    name: "Venmo",
    tagline: "Mobile payments made easy",
    description: "Popular for household staff. Instant transfer to bank for a small fee, or free next-day.",
    url: "https://venmo.com",
    cta: "Open Venmo",
    color: "border-blue-200 hover:border-blue-400",
    badge: null,
  },
  {
    id: "paypal",
    icon: "🔵",
    name: "PayPal",
    tagline: "Widely accepted online payment",
    description: "Send money to any email address or phone number. Standard fees apply for business transactions.",
    url: "https://www.paypal.com/us/digital-wallet/send-receive-money",
    cta: "Open PayPal",
    color: "border-indigo-200 hover:border-indigo-400",
    badge: null,
  },
  {
    id: "wise",
    icon: "🌍",
    name: "Wise",
    tagline: "Best for international workers",
    description: "Formerly TransferWise. Low-fee international transfers with real exchange rates.",
    url: "https://wise.com/send-money",
    cta: "Open Wise",
    color: "border-teal-200 hover:border-teal-400",
    badge: null,
  },
  {
    id: "gusto",
    icon: "🟢",
    name: "Gusto",
    tagline: "Full-service payroll software",
    description: "Handles direct deposit, payroll taxes, W-2s, and compliance for household employers.",
    url: "https://gusto.com",
    cta: "Open Gusto",
    color: "border-green-200 hover:border-green-400",
    badge: null,
  },
  {
    id: "adp",
    icon: "🔴",
    name: "ADP",
    tagline: "Enterprise payroll & HR",
    description: "Comprehensive payroll, tax filing, and HR tools for larger households with multiple staff.",
    url: "https://www.adp.com",
    cta: "Open ADP",
    color: "border-red-200 hover:border-red-400",
    badge: null,
  },
];

const RECOMMENDED_OPTION = {
  id: "carehomepay",
  icon: "🏆",
  name: "Care.com HomePay",
  tagline: "The household payroll experts — since 1992",
  description:
    "The #1 recommended payroll service for household employers. HomePay handles everything: direct deposit, payroll tax calculations, quarterly filings, W-2s, state registrations, and employment law compliance. If you pay your house manager $2,600+ per year, you're a household employer and HomePay makes it easy and legal.",
  url: "https://www.care.com/homepay",
  cta: "Get started with HomePay →",
};

export default function PayNowModal({
  workerName,
  workerEmail,
  totalCents,
  totalHours,
  onClose,
}: PayNowModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pay {workerName}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{workerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none ml-4 mt-1"
          >
            ×
          </button>
        </div>

        {/* Amount banner */}
        <div className="mx-6 mt-4 mb-5 bg-brand-50 border border-brand-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-0.5">
              This week&apos;s pay
            </p>
            <p className="text-3xl font-bold text-brand-700">{formatMoney(totalCents)}</p>
          </div>
          <div className="text-right text-sm text-brand-600">
            <p className="font-medium">{totalHours.toFixed(2)} hrs</p>
            <p className="text-xs text-brand-400">approved time</p>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Recommended — Care.com HomePay */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                ⭐ Recommended
              </span>
              <span className="text-xs text-slate-400">Best for household employers</span>
            </div>
            <a
              href={RECOMMENDED_OPTION.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-amber-400 rounded-xl p-5 hover:bg-amber-50 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0">{RECOMMENDED_OPTION.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-slate-900 text-base">{RECOMMENDED_OPTION.name}</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Care.com
                    </span>
                  </div>
                  <p className="text-sm font-medium text-amber-700 mb-2">{RECOMMENDED_OPTION.tagline}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {RECOMMENDED_OPTION.description}
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-amber-700 group-hover:text-amber-800 transition">
                    {RECOMMENDED_OPTION.cta}
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Other payment options</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Grid of other options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_OPTIONS.map((opt) => (
              <a
                key={opt.id}
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block border rounded-xl p-4 transition group ${opt.color}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{opt.icon}</span>
                  <p className="font-semibold text-slate-900 text-sm">{opt.name}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1">{opt.tagline}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-2">{opt.description}</p>
                <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-800 transition">
                  {opt.cta} →
                </span>
              </a>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center mt-5 px-4">
            🔒 These are external payment services. The House Ledger does not process or guarantee
            payments. Always verify worker details before sending funds.
          </p>
        </div>
      </div>
    </div>
  );
}
