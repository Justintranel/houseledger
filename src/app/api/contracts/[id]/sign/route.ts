import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  signatureData: z.string().min(10), // base64 PNG data URL
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;
  const name = session.user.name ?? "Unknown";

  try {
    const contract = await prisma.contractDocument.findUnique({ where: { id: params.id } });
    if (!contract || contract.householdId !== hid)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (contract.status !== "SENT")
      return NextResponse.json({ error: "Contract must be in SENT status to sign" }, { status: 400 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });

    const now = new Date();
    const updated = await prisma.contractDocument.update({
      where: { id: params.id },
      data: {
        status: "SIGNED",
        signedAt: now,
        signatureData: parsed.data.signatureData,
        signerName: name,
        signerUserId: userId,
      },
    });

    await prisma.contractAction.create({
      data: {
        contractId: params.id,
        userId,
        action: "SIGN",
        notes: `Signed by ${name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/contracts/[id]/sign]", err);
    return NextResponse.json({ error: "Failed to sign contract" }, { status: 500 });
  }
}
