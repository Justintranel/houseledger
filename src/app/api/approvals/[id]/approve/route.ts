import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendPurchaseApprovedEmail } from "@/lib/email";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();

    // OWNER and FAMILY can approve purchase requests
    if (auth.role !== "OWNER" && auth.role !== "FAMILY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const request = await prisma.purchaseRequest.findFirst({
      where: { id, householdId: auth.householdId },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approverId: auth.userId,
      },
      include: {
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: "APPROVE",
      entityType: "PurchaseRequest",
      entityId: id,
      note: `Approved purchase request for ${request.vendor} — $${request.amount}`,
    });

    // Notify the requester
    try {
      const requester = await prisma.user.findUnique({
        where: { id: request.requesterId },
        select: { name: true, email: true },
      });
      if (requester) {
        await sendPurchaseApprovedEmail(
          requester.email,
          requester.name,
          request.vendor,
          request.amount
        );
      }
    } catch (emailErr) {
      console.error("[approve] email failed:", emailErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/approvals/[id]/approve]", err);
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}
