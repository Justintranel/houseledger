import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        status: "APPROVED",
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
      action: "APPROVE",
      entityType: "PurchaseRequest",
      entityId: id,
      note: `Approved purchase request for ${request.vendor} — $${request.amount}`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/approvals/[id]/approve]", err);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    );
  }
}
