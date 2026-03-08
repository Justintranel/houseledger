import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/approvals/[id]/receipts/[receiptId] — remove a receipt */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; receiptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hid = session.user.householdId;
  const { id: requestId, receiptId } = params;

  try {
    // Verify the purchase request belongs to this household
    const purchaseRequest = await prisma.purchaseRequest.findFirst({
      where: { id: requestId, householdId: hid },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    // Verify the receipt belongs to this purchase request
    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, requestId },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    await prisma.receipt.delete({ where: { id: receiptId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/approvals/[id]/receipts/[receiptId]]", err);
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
  }
}
