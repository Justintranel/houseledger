import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The House Ledger",
  description: "How The House Ledger collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">🏠 The House Ledger</Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-brand-700">Sign in →</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14 prose prose-slate">
        <h1>Privacy Policy</h1>
        <p className="text-slate-500 text-sm">Last updated: March 2026</p>

        <p>The House Ledger ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our household management platform at <strong>thehouseledger.com</strong>.</p>
        <p>Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform.</p>

        <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px 20px', margin: '24px 0'}}>
          <p style={{margin: 0, fontWeight: 600, color: '#92400e'}}>⚠️ Important Notice: Do Not Enter Sensitive Financial Information</p>
          <p style={{margin: '8px 0 0', color: '#78350f'}}>The House Ledger is a household management tool, not a financial vault. <strong>We strongly advise against entering sensitive financial information</strong> into the platform, including but not limited to: full credit card numbers, bank account numbers, social security numbers, government ID numbers, or passwords for external accounts. While we take security seriously, no cloud-based platform should be used as a primary store for this type of information. Use a dedicated password manager or financial institution for sensitive credentials.</p>
        </div>

        <h2>1. Information We Collect</h2>
        <h3>Information You Provide Directly</h3>
        <ul>
          <li><strong>Account information:</strong> Name, email address, and password when you create an account.</li>
          <li><strong>Household data:</strong> Property details, room information, Standard Operating Procedures (SOPs), vendor contacts, maintenance records, and task lists you enter into the platform.</li>
          <li><strong>Staff and family information:</strong> Names and email addresses of household managers and family members you invite to your household.</li>
          <li><strong>Communications:</strong> Messages sent through the platform's messaging features between owners and managers.</li>
          <li><strong>Financial data:</strong> Purchase requests, approval records, and payroll information you track within the platform. Payment processing is handled by Stripe — we do not store your full card number.</li>
          <li><strong>Files and photos:</strong> Documents, receipts, and images you upload to the platform.</li>
        </ul>

        <h3>Information Collected Automatically</h3>
        <ul>
          <li><strong>Usage data:</strong> Pages visited, features used, and actions taken within the platform.</li>
          <li><strong>Device information:</strong> Browser type, operating system, and IP address.</li>
          <li><strong>Session data:</strong> Authentication tokens stored in secure cookies to keep you logged in.</li>
          <li><strong>Error data:</strong> Technical errors and performance data collected via Sentry to help us identify and fix bugs.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and maintain the House Ledger platform</li>
          <li>Create and manage your account and household</li>
          <li>Process subscription payments via Stripe</li>
          <li>Send transactional emails (welcome, invitations, purchase approvals, password resets, weekly summaries)</li>
          <li>Respond to support inquiries and provide customer service</li>
          <li>Detect, prevent, and address technical issues and security threats</li>
          <li>Improve the platform based on usage patterns and feedback</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal information to third parties. We do not use your data for advertising purposes.</p>

        <h2>3. Household Data Isolation</h2>
        <p>Each household on The House Ledger is completely isolated. Users associated with one household cannot view, access, or interact with any data belonging to another household. This isolation is enforced at the database level.</p>
        <p>Within a household, data is shared between the household owner, assigned managers, and invited family members based on their role and permissions.</p>

        <h2>4. How We Share Your Information</h2>
        <p>We share your information only in the following limited circumstances:</p>
        <ul>
          <li><strong>Service providers:</strong> We use trusted third-party services to operate the platform, including:
            <ul>
              <li>Railway (cloud hosting and infrastructure)</li>
              <li>Amazon Web Services S3 (file storage)</li>
              <li>Stripe (payment processing)</li>
              <li>Resend (transactional email delivery)</li>
              <li>Sentry (error monitoring)</li>
            </ul>
            These providers are contractually obligated to protect your data and use it only to provide their services.
          </li>
          <li><strong>Legal requirements:</strong> We may disclose your information if required by law, subpoena, or other legal process, or to protect the rights and safety of our users or the public.</li>
          <li><strong>Business transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your information is transferred and subject to a different privacy policy.</li>
        </ul>

        <h2>5. Data Security</h2>
        <p>We implement industry-standard security measures to protect your information:</p>
        <ul>
          <li>All data is transmitted over HTTPS/TLS encryption</li>
          <li>Passwords are hashed using bcrypt and never stored in plain text</li>
          <li>Authentication tokens are stored in secure, HTTP-only cookies</li>
          <li>Database access is restricted to authorized application processes only</li>
          <li>File uploads are stored in private cloud storage with access controls</li>
        </ul>
        <p>No method of transmission over the internet is 100% secure. While we take all reasonable measures to protect your data, we cannot guarantee absolute security.</p>

        <h2>6. Data Retention</h2>
        <p>We retain your data for as long as your account is active and your subscription is in good standing. Specifically:</p>
        <ul>
          <li><strong>Active accounts:</strong> All data is retained for the duration of your subscription.</li>
          <li><strong>After cancellation:</strong> Your data is retained for 30 days following the end of your subscription, during which you may request an export. After 30 days, your data is permanently deleted.</li>
          <li><strong>Backup retention:</strong> Database backups may retain data for up to 14 additional days beyond the above periods.</li>
        </ul>

        <h2>7. Your Rights and Choices</h2>
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
          <li><strong>Portability:</strong> Request your data in a portable, machine-readable format.</li>
          <li><strong>Opt-out of emails:</strong> You may unsubscribe from non-essential communications at any time. Note that transactional emails (like password resets and purchase approvals) cannot be disabled while your account is active.</li>
        </ul>
        <p>To exercise any of these rights, please contact us at <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a>.</p>

        <h2>8. Cookies</h2>
        <p>We use the following cookies:</p>
        <ul>
          <li><strong>Session cookies:</strong> Required for authentication and keeping you logged in. These are secure, HTTP-only cookies that expire when you close your browser or log out.</li>
          <li><strong>Preference cookies:</strong> Used to remember settings you configure within the platform.</li>
        </ul>
        <p>We do not use advertising cookies or third-party tracking cookies.</p>

        <h2>9. Children's Privacy</h2>
        <p>The House Ledger is not directed to children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a>.</p>

        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a prominent notice on the platform. Your continued use of the platform after changes become effective constitutes your acceptance of the updated policy.</p>

        <h2>11. Contact Us</h2>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
        <p>
          <strong>The House Ledger</strong><br />
          Email: <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a><br />
          Website: <a href="https://www.thehouseledger.com">www.thehouseledger.com</a>
        </p>
      </div>

      <footer className="border-t border-slate-200 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} The House Ledger. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-brand-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-700">Terms of Service</Link>
            <a href="mailto:hello@thehouseledger.com" className="hover:text-brand-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
