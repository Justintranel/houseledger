import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { sendPurchaseDeniedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";
  const userId = (session.user as any).id as string;

  if (role !== "OWNER" && role !== "FAMILY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    const request = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.householdId !== hid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: "DENIED",
        denialReason: reason,
        approverId: userId,
        
      },
      include: {
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await audit({
      householdId: hid,
      userId,
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
    console.error("[POST /api/approvals/[id]/deny]", err);
    return NextResponse.json(
      { error: "Failed to deny request" },
      { status: 500 }
    );
  }
}
