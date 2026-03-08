import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const contract = await prisma.contractDocument.findUnique({ where: { id: params.id } });
    if (!contract || contract.householdId !== hid)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (contract.status !== "DRAFT")
      return NextResponse.json({ error: "Only DRAFT contracts can be sent for signature" }, { status: 400 });

    await prisma.contractDocument.update({
      where: { id: params.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    await prisma.contractAction.create({
      data: { contractId: params.id, userId, action: "SEND", notes: "Contract sent for internal signature." },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/contracts/[id]/send]", err);
    return NextResponse.json({ error: "Failed to send contract" }, { status: 500 });
  }
}
