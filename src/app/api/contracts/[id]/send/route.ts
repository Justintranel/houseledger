import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "contracts:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const contract = await prisma.contractDocument.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!contract)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (contract.status !== "DRAFT")
      return NextResponse.json(
        { error: "Only DRAFT contracts can be sent for signature" },
        { status: 400 }
      );

    await prisma.contractDocument.update({
      where: { id: params.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    await prisma.contractAction.create({
      data: {
        contractId: params.id,
        userId: auth.userId,
        action: "SEND",
        notes: "Contract sent for internal signature.",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/contracts/[id]/send]", err);
    return NextResponse.json({ error: "Failed to send contract" }, { status: 500 });
  }
}
