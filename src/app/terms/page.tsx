import Link from "next/link";
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold text-brand-700">🏠 The House Ledger System</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-14 prose prose-slate">
        <h1>Terms of Service</h1>
        <p className="text-slate-500">Last updated: {new Date().getFullYear()}</p>
        <h2>1. Acceptance</h2>
        <p>By accessing House Ledger Software you agree to these terms. If you do not agree, do not use the service.</p>
        <h2>2. Service Description</h2>
        <p>House Ledger provides a household management portal for homeowners and household managers.</p>
        <h2>3. Account Responsibilities</h2>
        <p>You are responsible for maintaining the security of your account credentials and all activity that occurs under your account.</p>
        <h2>4. Billing</h2>
        <p>Subscriptions are billed monthly. Cancel anytime. Refunds are handled per our refund policy.</p>
        <h2>5. Data & Privacy</h2>
        <p>Your household data is private and isolated. See our <Link href="/privacy">Privacy Policy</Link>.</p>
        <h2>6. Limitation of Liability</h2>
        <p>House Ledger is provided "as is" without warranties. We are not liable for indirect or consequential damages.</p>
        <h2>7. Contact</h2>
        <p>Questions: <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a></p>
      </div>
    </div>
  );
}
