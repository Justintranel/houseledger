import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { sendPurchaseDeniedEmail } from "@/lib/email";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();

    // OWNER and FAMILY can deny purchase requests
    if (auth.role !== "OWNER" && auth.role !== "FAMILY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    const request = await prisma.purchaseRequest.findFirst({
      where: { id, householdId: auth.householdId },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: "DENIED",
        denialReason: reason,
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
      action: "DENY",
      entityType: "PurchaseRequest",
      entityId: id,
      note: `Denied purchase request for ${request.vendor} — $${request.amount}. Reason: ${reason}`,
    });

    // Notify the requester
    try {
      const requester = await prisma.user.findUnique({
        where: { id: request.requesterId },
        select: { name: true, email: true },
      });
      if (requester) {
        await sendPurchaseDeniedEmail(
          requester.email,
          requester.name,
          request.vendor,
          request.amount,
          reason
        );
      }
    } catch (emailErr) {
      console.error("[deny] email failed:", emailErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/approvals/[id]/deny]", err);
    return NextResponse.json({ error: "Failed to deny request" }, { status: 500 });
  }
}
