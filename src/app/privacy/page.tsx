import Link from "next/link";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold text-brand-700">🏠 The House Ledger System</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-14 prose prose-slate">
        <h1>Privacy Policy</h1>
        <p className="text-slate-500">Last updated: {new Date().getFullYear()}</p>
        <h2>Information We Collect</h2>
        <p>We collect email addresses, names, and household data you enter into the platform.</p>
        <h2>How We Use It</h2>
        <p>We use your data solely to provide the House Ledger service. We do not sell data to third parties.</p>
        <h2>Data Isolation</h2>
        <p>Each household is fully isolated. Members of one household cannot access another household's data.</p>
        <h2>Data Retention</h2>
        <p>Your data is retained while your subscription is active, and for 30 days after cancellation.</p>
        <h2>Cookies</h2>
        <p>We use session cookies for authentication only.</p>
        <h2>Contact</h2>
        <p><a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a></p>
      </div>
    </div>
  );
}
