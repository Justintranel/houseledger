import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendInviteEmail,
  sendPurchaseRequestEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendClockInEmail,
  sendClockOutEmail,
  sendWeeklySummaryEmail,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { to } = await req.json();
    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Missing 'to' email address" }, { status: 400 });
    }

    const APP_URL = process.env.NEXTAUTH_URL ?? "https://thehouseledger.com";
    const results: string[] = [];

    // 1. Password Reset
    try {
      await sendPasswordResetEmail(to, "SAMPLE_RESET_TOKEN_ABC123");
      results.push("✅ Password Reset");
    } catch (e: any) { results.push(`❌ Password Reset: ${e.message}`); }

    // 2. Welcome
    try {
      await sendWelcomeEmail(to, "Sarah Johnson", "The Johnson Household");
      results.push("✅ Welcome Email");
    } catch (e: any) { results.push(`❌ Welcome: ${e.message}`); }

    // 3. Team Invite — Manager
    try {
      await sendInviteEmail(to, "Sarah Johnson", "The Johnson Household", "MANAGER", "TempPass@123");
      results.push("✅ Manager Invite");
    } catch (e: any) { results.push(`❌ Manager Invite: ${e.message}`); }

    // 4. Team Invite — Family
    try {
      await sendInviteEmail(to, "Sarah Johnson", "The Johnson Household", "FAMILY", "FamilyPass@456");
      results.push("✅ Family Member Invite");
    } catch (e: any) { results.push(`❌ Family Invite: ${e.message}`); }

    // 5. Purchase Request (to owner)
    try {
      await sendPurchaseRequestEmail(
        to,
        "Sarah Johnson",
        "Maria Garcia",
        "Home Depot",
        127.49,
        "Cleaning supplies and light bulbs for kitchen and bathrooms",
        "req_sample_001"
      );
      results.push("✅ Purchase Request");
    } catch (e: any) { results.push(`❌ Purchase Request: ${e.message}`); }

    // 6. Purchase Approved (to manager)
    try {
      await sendPurchaseApprovedEmail(to, "Maria Garcia", "Home Depot", 127.49);
      results.push("✅ Purchase Approved");
    } catch (e: any) { results.push(`❌ Purchase Approved: ${e.message}`); }

    // 7. Purchase Denied (to manager)
    try {
      await sendPurchaseDeniedEmail(
        to,
        "Maria Garcia",
        "Williams-Sonoma",
        349.99,
        "Please find a more cost-effective option — check Amazon first."
      );
      results.push("✅ Purchase Denied");
    } catch (e: any) { results.push(`❌ Purchase Denied: ${e.message}`); }

    // 8. Clock In
    try {
      await sendClockInEmail(to, "Maria Garcia", "9:02 AM", "The Johnson Household");
      results.push("✅ Clock In");
    } catch (e: any) { results.push(`❌ Clock In: ${e.message}`); }

    // 9. Clock Out
    try {
      await sendClockOutEmail(to, "Maria Garcia", "9:02 AM", "4:47 PM", 465, "The Johnson Household");
      results.push("✅ Clock Out");
    } catch (e: any) { results.push(`❌ Clock Out: ${e.message}`); }

    // 10. Weekly Summary
    try {
      await sendWeeklySummaryEmail({
        ownerEmail: to,
        ownerName: "Sarah Johnson",
        householdName: "The Johnson Household",
        weekLabel: "Mar 3 – Mar 7, 2026",
        managers: [
          { name: "Maria Garcia", hoursWorked: 38.5, tasksCompleted: 24, tasksPending: 3 },
        ],
        notesCount: 7,
        purchasesApproved: 2,
        purchasesTotal: 254.98,
        recentNotes: [
          { author: "Maria Garcia", content: "Fixed the dripping faucet in the master bathroom — needed a new washer.", date: "Mar 6" },
          { author: "Maria Garcia", content: "Pantry restocked. Running low on paper towels — added to list.", date: "Mar 5" },
          { author: "Sarah Johnson", content: "Remind Maria about the AC filter — needs replacing this month.", date: "Mar 4" },
        ],
      });
      results.push("✅ Weekly Summary");
    } catch (e: any) { results.push(`❌ Weekly Summary: ${e.message}`); }

    return NextResponse.json({
      sent: results.filter((r) => r.startsWith("✅")).length,
      total: results.length,
      results,
    });
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/admin/test-emails]", err);
    return NextResponse.json({ error: "Failed to send test emails" }, { status: 500 });
  }
}
