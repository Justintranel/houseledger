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

// ─── 7. Weekly Summary (sent Friday night) ────────────────────────────────

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
