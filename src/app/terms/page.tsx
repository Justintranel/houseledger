import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | The House Ledger",
  description: "Terms and conditions for using The House Ledger household management platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">🏠 The House Ledger</Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-brand-700">Sign in →</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14 prose prose-slate">
        <h1>Terms of Service</h1>
        <p className="text-slate-500 text-sm">Last updated: March 2026</p>

        <p>These Terms of Service ("Terms") govern your access to and use of The House Ledger platform ("Service"), operated by The House Ledger ("we," "us," or "our"). By creating an account or using the Service, you agree to be bound by these Terms.</p>
        <p>If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>

        <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px 20px', margin: '24px 0'}}>
          <p style={{margin: 0, fontWeight: 600, color: '#92400e'}}>⚠️ Sensitive Information Warning</p>
          <p style={{margin: '8px 0 0', color: '#78350f'}}>The House Ledger is a household management and operations platform. <strong>We strongly recommend that you do NOT enter sensitive personal or financial information</strong> into the platform, including full credit card numbers, bank account numbers, social security numbers, government-issued ID numbers, or passwords to external accounts. You use the platform at your own risk with respect to any information you choose to store. The House Ledger assumes no liability for any damages arising from your decision to store sensitive information within the platform.</p>
        </div>

        <h2>1. Description of Service</h2>
        <p>The House Ledger is a household management platform designed for homeowners and their household staff. The Service includes tools for task management, household documentation (SOPs), vendor management, purchase approvals, time tracking, payroll tracking, real-time communication, and related features as described on our website.</p>

        <h2>2. Account Registration</h2>
        <p>To use the Service, you must create an account by providing accurate and complete information. You are responsible for:</p>
        <ul>
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activity that occurs under your account</li>
          <li>Promptly notifying us of any unauthorized access to your account at <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a></li>
        </ul>
        <p>You may not share your account with others or create accounts for the purpose of automated access. Each household subscription is for use by one household.</p>

        <h2>3. Acceptable Use</h2>
        <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul>
          <li>Use the Service in any way that violates applicable federal, state, or local laws or regulations</li>
          <li>Upload or transmit any material that is unlawful, threatening, abusive, defamatory, or otherwise objectionable</li>
          <li>Attempt to gain unauthorized access to any portion of the Service or its infrastructure</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Reverse engineer, decompile, or disassemble any portion of the Service</li>
          <li>Use the Service to store or transmit malicious code</li>
          <li>Reproduce, duplicate, or resell any portion of the Service without our written permission</li>
          <li>Use the Service to manage a property on behalf of a third party without their knowledge or consent</li>
        </ul>

        <h2>4. Free Trial</h2>
        <p>We offer a 7-day free trial for new accounts. During the trial period:</p>
        <ul>
          <li>A valid payment method is required to start the trial</li>
          <li>You will not be charged during the trial period</li>
          <li>If you do not cancel before the trial ends, your payment method will be automatically charged the monthly subscription fee</li>
          <li>You may cancel at any time during the trial period at no charge through your billing settings</li>
        </ul>

        <h2>5. Billing and Payments</h2>
        <h3>Subscription Fees</h3>
        <p>Access to the Service requires a paid subscription following the free trial. Current pricing is available at <a href="https://www.thehouseledger.com/pricing">www.thehouseledger.com/pricing</a>. We reserve the right to change pricing with 30 days' notice to active subscribers.</p>

        <h3>Billing Cycle</h3>
        <p>Subscriptions are billed monthly on the anniversary of your trial end date. All fees are non-refundable except as expressly stated in these Terms.</p>

        <h3>Payment Processing</h3>
        <p>Payments are processed by Stripe, Inc. By providing payment information, you authorize us to charge your payment method for the subscription fees. You agree to Stripe's terms of service, available at <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer">stripe.com/legal</a>.</p>

        <h3>Failed Payments</h3>
        <p>If a payment fails, we will attempt to notify you by email. Your account may be suspended if payment is not resolved within a reasonable period. We reserve the right to terminate accounts with unresolved payment failures.</p>

        <h3>Cancellation</h3>
        <p>You may cancel your subscription at any time through your billing settings. Cancellation takes effect at the end of your current billing period. You will retain access to the Service until the end of the period you have paid for. No refunds are provided for unused portions of a billing period.</p>

        <h2>6. Household Data and Privacy</h2>
        <p>Your use of the Service is subject to our <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. You retain ownership of all data you enter into the Service ("Household Data").</p>
        <p>By using the Service, you grant us a limited, non-exclusive license to store, process, and display your Household Data solely for the purpose of providing the Service to you.</p>
        <p>You represent that you have all necessary rights and permissions to upload and use any data, photos, or files you submit to the Service.</p>

        <h2>7. Invited Users</h2>
        <p>As a household owner, you may invite household managers and family members to your household account. You are responsible for:</p>
        <ul>
          <li>Ensuring invited users agree to these Terms before using the Service</li>
          <li>All activity by users you have invited to your household</li>
          <li>Promptly revoking access for users who should no longer have it</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>The Service, including its design, software, features, and content (excluding your Household Data), is owned by The House Ledger and is protected by intellectual property laws. These Terms do not grant you any right, title, or interest in the Service beyond the limited license to use it as described herein.</p>
        <p>You may not use our trademarks, logos, or brand elements without our prior written consent.</p>

        <h2>9. Disclaimer of Warranties</h2>
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
        <p>We do not warrant that the Service will be uninterrupted, error-free, or completely secure. We make no warranty regarding the accuracy or reliability of any information obtained through the Service.</p>

        <h2>10. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE HOUSE LEDGER, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
        <p>THE HOUSE LEDGER IS NOT RESPONSIBLE OR LIABLE FOR: (A) ANY DATA LOSS OR BREACH RESULTING FROM INFORMATION YOU CHOOSE TO STORE IN THE PLATFORM; (B) ANY ACTIONS TAKEN BY HOUSEHOLD STAFF OR INVITED USERS WITH ACCESS TO YOUR ACCOUNT; (C) THE ACCURACY OR COMPLETENESS OF ANY INFORMATION ENTERED BY YOU OR YOUR HOUSEHOLD STAFF; (D) ANY DECISIONS MADE BASED ON INFORMATION TRACKED WITHIN THE PLATFORM, INCLUDING PAYROLL, SCHEDULING, OR PURCHASE APPROVALS; OR (E) ANY UNAUTHORIZED ACCESS TO YOUR ACCOUNT RESULTING FROM YOUR FAILURE TO MAINTAIN SECURE CREDENTIALS.</p>
        <p>YOU EXPRESSLY AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. YOU ARE SOLELY RESPONSIBLE FOR ALL CONTENT YOU UPLOAD OR STORE IN THE PLATFORM AND FOR THE MANAGEMENT OF ACCESS PERMISSIONS FOR YOUR HOUSEHOLD MEMBERS AND STAFF.</p>
        <p>OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID US IN THE THREE MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).</p>

        <h2>11. Indemnification</h2>
        <p>You agree to indemnify, defend, and hold harmless The House Ledger and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; or (c) your violation of any rights of a third party.</p>

        <h2>12. Termination</h2>
        <p>We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or the integrity of the Service.</p>
        <p>You may terminate your account at any time by canceling your subscription and contacting us at <a href="mailto:hello@thehouseledger.com">hello@thehouseledger.com</a> to request account deletion.</p>
        <p>Upon termination, your right to use the Service will immediately cease. We will retain your data for 30 days following termination, after which it will be permanently deleted.</p>

        <h2>13. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions. Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules.</p>

        <h2>14. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms at any time. We will notify you of material changes by email or by posting a notice on the platform at least 14 days before changes take effect. Your continued use of the Service after changes become effective constitutes your acceptance of the updated Terms.</p>

        <h2>15. Contact</h2>
        <p>If you have questions about these Terms, please contact us:</p>
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
