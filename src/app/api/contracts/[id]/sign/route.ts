import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  signatureData: z.string().min(10).max(500_000), // base64 PNG data URL — cap at ~375 KB raw
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "contracts:sign"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const contract = await prisma.contractDocument.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!contract)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (contract.status !== "SENT")
      return NextResponse.json(
        { error: "Contract must be in SENT status to sign" },
        { status: 400 }
      );

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid" },
        { status: 400 }
      );

    const now = new Date();
    const updated = await prisma.contractDocument.update({
      where: { id: params.id },
      data: {
        status: "SIGNED",
        signedAt: now,
        signatureData: parsed.data.signatureData,
        signerName: auth.name,
        signerUserId: auth.userId,
      },
    });

    await prisma.contractAction.create({
      data: {
        contractId: params.id,
        userId: auth.userId,
        action: "SIGN",
        notes: `Signed by ${auth.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/contracts/[id]/sign]", err);
    return NextResponse.json({ error: "Failed to sign contract" }, { status: 500 });
  }
}
