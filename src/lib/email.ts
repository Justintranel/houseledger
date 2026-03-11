import { Resend } from "resend";

// Lazy init — don't create at module load time so build doesn't fail without the key
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
function getFrom() { return process.env.EMAIL_FROM ?? "onboarding@resend.dev"; }
function getAppUrl() { return process.env.NEXTAUTH_URL ?? "http://localhost:3001"; }
const APP_NAME = "The House Ledger";

// ─── Shared layout wrapper ─────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1d3557;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">🏠 ${APP_NAME}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              © ${new Date().getFullYear()} ${APP_NAME} · <a href="${getAppUrl()}" style="color:#94a3b8;">thehouseledger.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<p style="text-align:center;margin:28px 0 0;">
    <a href="${url}" style="display:inline-block;background:#1d3557;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;">${text}</a>
  </p>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#475569;">${text}</p>`;
}

function note(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">${text}</p>`;
}

// ─── 1. Password Reset ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: layout(
      "Reset your password",
      `${h1("Reset your password")}
       ${p("We received a request to reset your password. Click the button below to choose a new one.")}
       ${btn("Reset Password", url)}
       ${note("This link expires in 1 hour. If you didn't request a reset, you can ignore this email — your password won't change.")}`
    ),
  });
}

// ─── 2. Welcome — new owner account ───────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, householdName: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html: layout(
      `Welcome to ${APP_NAME}`,
      `${h1(`Welcome, ${name}! 👋`)}
       ${p(`Your household <strong>${householdName}</strong> is set up and ready to go on ${APP_NAME}.`)}
       ${p("Log in to manage your household, assign tasks to your house manager, track inventory, approve purchases, and more.")}
       ${btn("Go to my dashboard", `${getAppUrl()}/dashboard`)}
       ${note("If you have any questions, reply to this email and we'll be happy to help.")}`
    ),
  });
}

// ─── 3. Team member invited ────────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  householdName: string,
  role: "FAMILY" | "MANAGER",
  tempPassword: string
) {
  const roleLabel = role === "MANAGER" ? "House Manager" : "Family Member";

  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `You've been invited to ${householdName} on ${APP_NAME}`,
    html: layout(
      `You're invited!`,
      `${h1(`You've been invited! 🎉`)}
       ${p(`<strong>${inviterName}</strong> has added you as a <strong>${roleLabel}</strong> for <strong>${householdName}</strong> on ${APP_NAME}.`)}
       ${p("Here are your login credentials:")}
       <table style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:16px 0;width:100%;box-sizing:border-box;">
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Email</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${to}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Temporary Password</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${tempPassword}</td></tr>
       </table>
       ${btn("Sign in now", `${getAppUrl()}/login`)}
       ${note("Please change your password after your first login. If you weren't expecting this invitation, you can ignore this email.")}`
    ),
  });
}

// ─── 4. Purchase request submitted (notify owner) ─────────────────────────

export async function sendPurchaseRequestEmail(
  ownerEmail: string,
  ownerName: string,
  managerName: string,
  vendor: string,
  amount: number,
  description: string,
  requestId: string
) {
  const url = `${getAppUrl()}/dashboard/approvals`;

  await getResend().emails.send({
    from: getFrom(),
    to: ownerEmail,
    subject: `Purchase request from ${managerName} — $${amount.toFixed(2)}`,
    html: layout(
      "New purchase request",
      `${h1("New purchase request 💳")}
       ${p(`Hi ${ownerName}, <strong>${managerName}</strong> has submitted a purchase request that needs your approval.`)}
       <table style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:16px 0;width:100%;box-sizing:border-box;">
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Vendor</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${vendor}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Amount</td><td style="font-size:14px;font-weight:600;color:#1e293b;">$${amount.toFixed(2)}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;vertical-align:top;">Description</td><td style="font-size:14px;color:#1e293b;">${description}</td></tr>
       </table>
       ${btn("Review & Approve", url)}
       ${note("Log in to approve or deny this request.")}`
    ),
  });
}

// ─── 5. Purchase approved (notify manager) ────────────────────────────────

export async function sendPurchaseApprovedEmail(
  managerEmail: string,
  managerName: string,
  vendor: string,
  amount: number
) {
  await getResend().emails.send({
    from: getFrom(),
    to: managerEmail,
    subject: `✅ Purchase approved — ${vendor} $${amount.toFixed(2)}`,
    html: layout(
      "Purchase approved",
      `${h1("Your purchase was approved ✅")}
       ${p(`Hi ${managerName}, your purchase request has been approved.`)}
       <table style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:16px 0;width:100%;box-sizing:border-box;">
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Vendor</td><td style="font-size:14px;font-weight:600;color:#166534;">${vendor}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Amount</td><td style="font-size:14px;font-weight:600;color:#166534;">$${amount.toFixed(2)}</td></tr>
       </table>
       ${btn("View in dashboard", `${getAppUrl()}/dashboard/approvals`)}
       ${note("You're good to go ahead with this purchase.")}`
    ),
  });
}

// ─── 6. Purchase denied (notify manager) ──────────────────────────────────

export async function sendPurchaseDeniedEmail(
  managerEmail: string,
  managerName: string,
  vendor: string,
  amount: number,
  reason: string
) {
  await getResend().emails.send({
    from: getFrom(),
    to: managerEmail,
    subject: `❌ Purchase request denied — ${vendor}`,
    html: layout(
      "Purchase denied",
      `${h1("Purchase request denied ❌")}
       ${p(`Hi ${managerName}, your purchase request was not approved this time.`)}
       <table style="background:#fef2f2;border-radius:8px;padding:16px 20px;margin:16px 0;width:100%;box-sizing:border-box;">
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Vendor</td><td style="font-size:14px;font-weight:600;color:#991b1b;">${vendor}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Amount</td><td style="font-size:14px;font-weight:600;color:#991b1b;">$${amount.toFixed(2)}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;vertical-align:top;">Reason</td><td style="font-size:14px;color:#1e293b;">${reason}</td></tr>
       </table>
       ${btn("View in dashboard", `${getAppUrl()}/dashboard/approvals`)}
       ${note("If you have questions, reach out to your household owner.")}`
    ),
  });
}

// ─── 7. Clock In / Clock Out notifications ────────────────────────────────

export async function sendClockInEmail(
  to: string,
  workerName: string,
  time: string,
  householdName: string,
) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `⏱ ${workerName} clocked in — ${householdName}`,
    html: layout(
      "Clock-in notification",
      `${h1(`${workerName} just clocked in ⏱`)}
       ${p(`Your house manager <strong>${workerName}</strong> clocked in at <strong>${time}</strong> for <strong>${householdName}</strong>.`)}
       ${btn("View Timesheet", `${getAppUrl()}/dashboard/time`)}
       ${note("You're receiving this because clock-in notifications are enabled in your household settings.")}`,
    ),
  });
}

export async function sendClockOutEmail(
  to: string,
  workerName: string,
  clockIn: string,
  clockOut: string,
  durationMinutes: number,
  householdName: string,
) {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `✅ ${workerName} clocked out — ${householdName}`,
    html: layout(
      "Clock-out notification",
      `${h1(`${workerName} clocked out ✅`)}
       ${p(`Your house manager <strong>${workerName}</strong> finished their shift at <strong>${householdName}</strong>.`)}
       <table style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:16px 0;width:100%;box-sizing:border-box;">
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Clocked in</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${clockIn}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Clocked out</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${clockOut}</td></tr>
         <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Total time</td><td style="font-size:14px;font-weight:600;color:#1e293b;">${duration}</td></tr>
       </table>
       ${btn("Review & Approve", `${getAppUrl()}/dashboard/time`)}
       ${note("You're receiving this because clock-out notifications are enabled in your household settings.")}`,
    ),
  });
}

// ─── Drip Campaign: 7-day onboarding sequence (OWNER only) ───────────────

// Day 1 — Set up your House Profile
export async function sendDripDay1(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "Your House Profile is waiting — fill it out in 5 minutes",
    html: layout(
      "Set up your House Profile",
      `${h1(`One quick win for today, ${name} 🏠`)}
       ${p("The single most valuable thing you can do in your first week is fill out your <strong>House Profile</strong>.")}
       ${p("It's a centralized record of everything your house manager (or anyone covering for them) would ever need to know — your HVAC settings, preferred vendors, where the main water shut-off is, which grocery store you use, and dozens more details that prevent unnecessary texts and missed expectations.")}
       <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#0c4a6e;font-weight:600;">💡 Pro tip: Use the Quick-Start Wizard</p>
         <p style="margin:8px 0 0;font-size:14px;color:#0c4a6e;">It walks you through one question at a time. Skip anything you don't know yet. Mark items as "Not Applicable" if they don't apply to your home. Takes 5–15 minutes depending on how detailed you want to be.</p>
       </div>
       ${p("The more you fill in now, the fewer questions you'll get down the road. Most owners tell us this saves them hours of back-and-forth in the first month alone.")}
       ${btn("Open House Profile →", `${getAppUrl()}/dashboard/profile`)}
       ${note("Day 1 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 2 — How to hire a house manager
export async function sendDripDay2(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "How to hire the right house manager (the complete guide)",
    html: layout(
      "How to hire a house manager",
      `${h1(`How to hire a great house manager, ${name} 🤝`)}
       ${p("If you're still looking for a house manager — or thinking about upgrading — this is the most valuable email we'll send you. We've distilled everything you need to know into a practical, no-fluff guide.")}

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">What exactly is a house manager?</h2>
       ${p("A house manager is different from a housekeeper or personal assistant. They <em>own</em> the operations of your home. Think of them as a COO for your household — they manage vendors, coordinate maintenance, handle errands, supervise other staff, and keep everything running smoothly so you don't have to think about it.")}
       ${p("A good house manager anticipates needs before you voice them. A great one makes you feel like your home runs itself.")}

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">Where to find great candidates</h2>
       <ul style="margin:0;padding:0 0 0 20px;line-height:1.8;font-size:15px;color:#475569;">
         <li><strong>Referrals first.</strong> Ask trusted friends, family, or your neighbor with a house manager they love. The best candidates aren't on job boards.</li>
         <li><strong>Estate Executives / Domestic Staffing Agencies.</strong> Worth the placement fee — they pre-screen, do background checks, and match personality. Expect to pay 15–25% of first-year salary.</li>
         <li><strong>Indeed, LinkedIn, ZipRecruiter.</strong> Post under "House Manager," "Estate Manager," or "Household Manager." Be specific about the role.</li>
         <li><strong>Care.com HomePay, Nanny Lane, GreatAuPair.</strong> These household-specific platforms draw candidates who understand private service.</li>
         <li><strong>Your network of service providers.</strong> Your landscaper, contractor, or cleaner often knows someone excellent who is quietly looking.</li>
       </ul>

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">5 qualities to look for (beyond experience)</h2>
       <ul style="margin:0;padding:0 0 0 20px;line-height:1.8;font-size:15px;color:#475569;">
         <li><strong>Anticipation.</strong> Do they notice things before being asked? In the interview, ask: "Tell me about a time you spotted a problem before it became one." Listen for specifics.</li>
         <li><strong>Discretion.</strong> They will know everything about your life. Trust and confidentiality are non-negotiable. Check this with reference calls.</li>
         <li><strong>Ownership mentality.</strong> You want someone who treats your home like their own — not a clock-watcher. Ask: "How do you decide when your day is done?"</li>
         <li><strong>Communication style.</strong> Do they prefer texts, calls, or apps? Does it match yours? Mismatched communication is the #1 reason these relationships break down.</li>
         <li><strong>Adaptability.</strong> Household needs change. A great house manager rolls with it. Ask: "Tell me about a week where everything went sideways. What did you do?"</li>
       </ul>

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">The interview process</h2>
       ${p("Run at least two rounds. First: a 30-minute video call to assess communication, personality fit, and their questions (the best candidates always come prepared with questions about your household). Second: an in-person walkthrough of your home, where you can observe how they notice and interact with the space.")}
       ${p("Always check 3 references — and actually call them. Ask: 'Would you hire them again without hesitation?' A pause says more than the words.")}

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">What to pay</h2>
       ${p("Compensation varies significantly by market and scope of role. As a general benchmark:")}
       <table style="width:100%;background:#f8fafc;border-radius:8px;border-collapse:collapse;font-size:14px;margin:12px 0;">
         <tr style="background:#e2e8f0;"><th style="padding:8px 12px;text-align:left;color:#475569;">Role Scope</th><th style="padding:8px 12px;text-align:right;color:#475569;">Typical Range</th></tr>
         <tr><td style="padding:8px 12px;color:#1e293b;">Part-time (20 hrs/wk)</td><td style="padding:8px 12px;text-align:right;color:#1e293b;">$25–$40/hr</td></tr>
         <tr style="background:#f1f5f9;"><td style="padding:8px 12px;color:#1e293b;">Full-time, single property</td><td style="padding:8px 12px;text-align:right;color:#1e293b;">$65,000–$100,000/yr</td></tr>
         <tr><td style="padding:8px 12px;color:#1e293b;">Full-time, multi-property / high complexity</td><td style="padding:8px 12px;text-align:right;color:#1e293b;">$100,000–$180,000+/yr</td></tr>
       </table>
       ${p("Benefits like health insurance, PTO, mileage reimbursement, and a phone stipend are standard at full-time. Don't skip the employment contract — it protects both of you.")}

       <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:28px 0 8px;">Set them up for success from day one</h2>
       ${p("The biggest mistake owners make is hiring great and onboarding poorly. Use The House Ledger to give your new manager everything they need on day one: your house preferences, vendor contacts, emergency info, and daily tasks — all in one place.")}
       ${btn("Set up your household now →", `${getAppUrl()}/dashboard/profile`)}
       ${note("Day 2 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 3 — Time tracking & payroll
export async function sendDripDay3(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "How to track hours, set pay rates, and pay your team",
    html: layout(
      "Time tracking & payroll",
      `${h1(`Never wonder about hours again, ${name} ⏱`)}
       ${p("One of the most common frustrations household owners tell us about is having no clear record of when their manager was there, how long they worked, or whether timesheets are accurate.")}
       ${p("The House Ledger solves that completely. Here's how it works:")}
       <ol style="margin:16px 0;padding:0 0 0 20px;font-size:15px;color:#475569;line-height:1.9;">
         <li><strong>Your manager clocks in and out</strong> directly from their dashboard. You can optionally receive an email or SMS notification each time.</li>
         <li><strong>You review and approve</strong> timesheets at the end of each week. You can approve all at once or one at a time.</li>
         <li><strong>Set an hourly rate per worker.</strong> The system calculates exactly what's owed — no manual math.</li>
         <li><strong>View weekly payout totals</strong> by worker. Use that number to pay via Zelle, Venmo, or Care.com HomePay (for full payroll with taxes).</li>
       </ol>
       <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#14532d;font-weight:600;">✅ Invite your manager today</p>
         <p style="margin:8px 0 0;font-size:14px;color:#14532d;">Go to Settings → Team Members, enter their email, and they'll receive their login credentials. Once they're in, they can start clocking in and you can see their hours in real time.</p>
       </div>
       ${btn("Go to Time Tracking →", `${getAppUrl()}/dashboard/time`)}
       ${note("Day 3 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 4 — The House Ledger (home document PDF)
export async function sendDripDay4(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "Your home's complete record — always up to date",
    html: layout(
      "Your House Ledger",
      `${h1(`Your home has a lot of data, ${name} 📚`)}
       ${p("Your house manual. Your vendor list. Your appliance info. Your emergency contacts. Your preferences. Right now, that information probably lives in your head, in a binder somewhere, or scattered across texts and emails.")}
       ${p("The <strong>House Ledger</strong> pulls it all into one living document — always up to date, always accessible, and printable as a PDF whenever you need it.")}
       <div style="background:#fef9ec;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">📋 What's inside your House Ledger</p>
         <ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:14px;color:#92400e;line-height:1.8;">
           <li>Family & household overview</li>
           <li>Contacts: vendors, emergency, trusted neighbors</li>
           <li>All appliances with make, model, and service dates</li>
           <li>Utility providers and account info</li>
           <li>Home systems: HVAC, plumbing, electrical, security</li>
           <li>Your preferences and household rules</li>
           <li>Insurance documents and property records</li>
         </ul>
       </div>
       ${p("When a new house manager starts, hand them this document and they'll know your home inside and out from day one. When you go on vacation, every care instruction is right here. When something breaks, you know exactly who to call.")}
       ${p("It takes about 15 minutes to fill in. Print it, save it as a PDF, and share it with whoever needs it.")}
       ${btn("Open your House Ledger →", `${getAppUrl()}/dashboard/house-bible`)}
       ${note("Day 4 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 5 — Emergency preparedness
export async function sendDripDay5(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "5-minute task: get your emergency info ready",
    html: layout(
      "Emergency preparedness",
      `${h1(`A 5-minute task that could save hours, ${name} 🚨`)}
       ${p("You never think about it until you need it. That's exactly why today's task matters.")}
       ${p("The <strong>Emergency Info</strong> section of The House Ledger is where you store the information your house manager — or anyone watching your home — needs in a crisis:")}
       <ul style="margin:0;padding:0 0 0 20px;font-size:15px;color:#475569;line-height:1.9;">
         <li>Emergency contacts (family, trusted neighbors, backup contacts)</li>
         <li>Nearest hospital and urgent care</li>
         <li>Health insurance card details</li>
         <li>Allergy and medication information for every household member</li>
         <li>Pet emergency vet</li>
         <li>Utility emergency lines (gas, electric, water)</li>
         <li>Your alarm company's monitoring number</li>
       </ul>
       <div style="background:#fff1f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">⚡ Real scenario</p>
         <p style="margin:8px 0 0;font-size:14px;color:#991b1b;">Your manager is at the house. A pipe bursts. You're unreachable. Do they know who to call? Where the water shut-off is? What your plumber's emergency number is? With Emergency Info filled in, the answer is yes — every time.</p>
       </div>
       ${p("Takes 5 minutes. Worth it every single day.")}
       ${btn("Set up Emergency Info →", `${getAppUrl()}/dashboard/emergency`)}
       ${note("Day 5 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 6 — Daily management: tasks, notes, and messaging
export async function sendDripDay6(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "How to run your household day-to-day inside The House Ledger",
    html: layout(
      "Daily management",
      `${h1(`Running your home day-to-day, ${name} 📋`)}
       ${p("By now your House Profile is taking shape. Today we want to show you how to use The House Ledger for the day-to-day running of your home.")}

       <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 8px;">📌 Tasks — your manager's daily to-do list</h2>
       ${p("Create recurring or one-off tasks for your manager. Daily walk-through. Weekly fridge clean-out. Monthly HVAC filter check. Your manager marks them done, and you can see completion status at a glance. No more wondering if something got handled.")}

       <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 8px;">📝 Notes — the running household log</h2>
       ${p("Your manager logs what happened each day — what was done, what they noticed, what needs attention. You can add private owner notes that only you can see. Over time this becomes an invaluable record of your home's activity.")}

       <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 8px;">💬 Messaging — everything in one place</h2>
       ${p("Use the built-in chat to communicate with your manager directly in the platform. No more mixing household messages in with personal texts. Clear, searchable, and logged.")}

       <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 8px;">🛒 Purchase Approvals — no surprise charges</h2>
       ${p("Your manager submits a purchase request before spending — vendor, amount, and reason. You approve or deny with one click. You can set an auto-approve threshold for small amounts so you're not bogged down in tiny decisions.")}

       ${btn("Go to my dashboard →", `${getAppUrl()}/dashboard`)}
       ${note("Day 6 of 7 · The House Ledger Onboarding")}`
    ),
  });
}

// Day 7 — Week 1 check-in + community
export async function sendDripDay7(to: string, name: string) {
  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: "One week in — here's what successful owners do next",
    html: layout(
      "Week 1 complete",
      `${h1(`You made it through week one, ${name} 🎉`)}
       ${p("Seriously — most people set up an account and never do what you've been doing this week. You're building something that will save you hundreds of hours and countless headaches over the life of your home.")}
       ${p("Here's what successful household owners do in month one to make the most of The House Ledger:")}
       <ol style="margin:16px 0;padding:0 0 0 20px;font-size:15px;color:#475569;line-height:1.9;">
         <li><strong>Finish the House Profile.</strong> Use the Quick-Start Wizard to knock out any remaining questions. Aim for 80%+ answered.</li>
         <li><strong>Invite your house manager.</strong> Get them clocked in and using the task system this week.</li>
         <li><strong>Set up recurring tasks.</strong> Start with 3–5 that matter most: daily walkthrough, weekly grocery run, and whatever else you always remind them about.</li>
         <li><strong>Review timesheet Friday.</strong> Make it a 2-minute habit. Approve hours, see the weekly payout total.</li>
         <li><strong>Read the weekly summary email.</strong> Every Friday evening you'll get a digest of the week — hours worked, tasks completed, notes added, and purchases approved.</li>
       </ol>
       <div style="background:#f5f3ff;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#4c1d95;font-weight:600;">👩 Join the Community</p>
         <p style="margin:8px 0 0;font-size:14px;color:#4c1d95;">Connect with other household owners on The House Ledger Skool community. Ask questions, share what's working, and get ideas from people managing homes like yours. It's free and worth joining.</p>
       </div>
       ${btn("Join the Community →", "https://www.skool.com/thehouseledger")}
       <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#475569;">If you have questions about anything — how a feature works, how to handle a situation with your manager, or just feedback on the product — reply to this email. We read every one.</p>
       <p style="margin:12px 0;font-size:15px;color:#475569;">Here's to a home that runs itself. 🏠</p>
       ${note("Day 7 of 7 · The House Ledger Onboarding — you're all caught up!")}`
    ),
  });
}

// ─── 8. Weekly Summary (sent Friday night) ────────────────────────────────

export interface WeeklySummaryData {
  ownerEmail: string;
  ownerName: string;
  householdName: string;
  weekLabel: string; // e.g. "Mar 3 – Mar 7, 2025"
  managers: Array<{
    name: string;
    hoursWorked: number;
    tasksCompleted: number;
    tasksPending: number;
  }>;
  notesCount: number;
  purchasesApproved: number;
  purchasesTotal: number; // dollars
  recentNotes: Array<{ author: string; content: string; date: string }>;
}

export async function sendWeeklySummaryEmail(data: WeeklySummaryData) {
  const {
    ownerEmail, ownerName, householdName, weekLabel,
    managers, notesCount, purchasesApproved, purchasesTotal, recentNotes,
  } = data;

  const managerRows = managers.map((m) =>
    `<tr>
      <td style="padding:8px 12px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${m.name}</td>
      <td style="padding:8px 12px;font-size:14px;color:#1e293b;text-align:center;border-bottom:1px solid #f1f5f9;">${m.hoursWorked.toFixed(1)}h</td>
      <td style="padding:8px 12px;font-size:14px;color:#166534;text-align:center;border-bottom:1px solid #f1f5f9;">${m.tasksCompleted}</td>
      <td style="padding:8px 12px;font-size:14px;color:#92400e;text-align:center;border-bottom:1px solid #f1f5f9;">${m.tasksPending}</td>
    </tr>`
  ).join("");

  const notesList = recentNotes.slice(0, 5).map((n) =>
    `<li style="margin:6px 0;font-size:14px;color:#475569;"><strong>${n.author}</strong> (${n.date}): ${n.content}</li>`
  ).join("");

  await getResend().emails.send({
    from: getFrom(),
    to: ownerEmail,
    subject: `📋 Weekly Summary — ${householdName} (${weekLabel})`,
    html: layout(
      `Weekly Summary`,
      `${h1(`Weekly Summary 📋`)}
       ${p(`Hi ${ownerName}, here's a recap of everything that happened at <strong>${householdName}</strong> this week (${weekLabel}).`)}

       <h2 style="font-size:16px;font-weight:600;color:#1e293b;margin:24px 0 12px;">👷 Staff Activity</h2>
       <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
         <thead>
           <tr style="background:#e2e8f0;">
             <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Manager</th>
             <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;">Hours</th>
             <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;">Tasks Done</th>
             <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;">Pending</th>
           </tr>
         </thead>
         <tbody>${managerRows || `<tr><td colspan="4" style="padding:12px;font-size:14px;color:#94a3b8;text-align:center;">No activity this week</td></tr>`}</tbody>
       </table>

       <h2 style="font-size:16px;font-weight:600;color:#1e293b;margin:24px 0 12px;">📊 Quick Stats</h2>
       <table style="width:100%;background:#f8fafc;border-radius:8px;padding:4px;border-collapse:collapse;">
         <tr>
           <td style="padding:10px 16px;font-size:14px;color:#64748b;">Notes added</td>
           <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${notesCount}</td>
         </tr>
         <tr style="border-top:1px solid #e2e8f0;">
           <td style="padding:10px 16px;font-size:14px;color:#64748b;">Purchases approved</td>
           <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${purchasesApproved} ($${purchasesTotal.toFixed(2)})</td>
         </tr>
       </table>

       ${recentNotes.length > 0 ? `
       <h2 style="font-size:16px;font-weight:600;color:#1e293b;margin:24px 0 12px;">📝 Recent Notes</h2>
       <ul style="margin:0;padding:0 0 0 18px;">${notesList}</ul>` : ""}

       ${btn("View Full Dashboard", `${getAppUrl()}/dashboard`)}
       ${note("You're receiving this every Friday evening as your weekly household digest.")}`
    ),
  });
}
