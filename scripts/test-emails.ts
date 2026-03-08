/**
 * Test script — sends all 7 email templates to a given address.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-emails.ts
 */

// Load env vars from .env
import * as dotenv from "dotenv";
dotenv.config();

import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendInviteEmail,
  sendPurchaseRequestEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendWeeklySummaryEmail,
} from "../src/lib/email";

// Accept email from command line: npx ts-node ... scripts/test-emails.ts you@email.com
const TO = process.argv[2] ?? "Justin@sphererocket.com";

async function main() {
  console.log(`\n📧 Sending all 7 test emails to ${TO}...\n`);

  // 1. Password Reset
  console.log("1/7  Sending: Password Reset...");
  await sendPasswordResetEmail(TO, "test-token-abc123def456");
  console.log("     ✅ Sent!\n");

  // 2. Welcome
  console.log("2/7  Sending: Welcome...");
  await sendWelcomeEmail(TO, "Justin", "The Nelson Household");
  console.log("     ✅ Sent!\n");

  // 3. Team Invite (Manager)
  console.log("3/7  Sending: Team Invite (Manager)...");
  await sendInviteEmail(
    TO,
    "Justin Nelson",
    "The Nelson Household",
    "MANAGER",
    "Temp#Pass99!"
  );
  console.log("     ✅ Sent!\n");

  // 4. Purchase Request (owner notification)
  console.log("4/7  Sending: Purchase Request submitted...");
  await sendPurchaseRequestEmail(
    TO,
    "Justin",
    "Maria (House Manager)",
    "Home Depot",
    284.50,
    "Replacement kitchen faucet and installation supplies",
    "req_test_123"
  );
  console.log("     ✅ Sent!\n");

  // 5. Purchase Approved
  console.log("5/7  Sending: Purchase Approved...");
  await sendPurchaseApprovedEmail(
    TO,
    "Maria",
    "Home Depot",
    284.50
  );
  console.log("     ✅ Sent!\n");

  // 6. Purchase Denied
  console.log("6/7  Sending: Purchase Denied...");
  await sendPurchaseDeniedEmail(
    TO,
    "Maria",
    "Williams Sonoma",
    549.00,
    "We already have enough cookware. Let's revisit next quarter."
  );
  console.log("     ✅ Sent!\n");

  // 7. Weekly Summary
  console.log("7/7  Sending: Weekly Summary...");
  await sendWeeklySummaryEmail({
    ownerEmail: TO,
    ownerName: "Justin",
    householdName: "The Nelson Household",
    weekLabel: "Mar 3 – Mar 7, 2025",
    managers: [
      { name: "Maria Lopez", hoursWorked: 38.5, tasksCompleted: 24, tasksPending: 3 },
    ],
    notesCount: 7,
    purchasesApproved: 3,
    purchasesTotal: 612.75,
    recentNotes: [
      { author: "Maria Lopez", content: "Replaced the HVAC filter in the upstairs hallway. Left old one in garage for records.", date: "Mar 7" },
      { author: "Maria Lopez", content: "Grocery run completed. Restocked pantry essentials and cleaning supplies.", date: "Mar 6" },
      { author: "Maria Lopez", content: "Called plumber re: slow drain in master bath. Appointment scheduled for Tuesday.", date: "Mar 5" },
    ],
  });
  console.log("     ✅ Sent!\n");

  console.log(`🎉 All 7 emails sent to ${TO}! Check your inbox.\n`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
