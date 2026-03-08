import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  vendor: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  reason: z.string().min(1).max(1000),
  neededBy: z.string().optional(),
  vendorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: { householdId: hid },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
        receipts: true,
      },
    });

    return NextResponse.json(requests);
  } catch (err) {
    console.error("[GET /api/approvals]", err);
    return NextResponse.json(
      { error: "Failed to load approval requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { amount, vendor, category, reason, neededBy, vendorId } =
      parsed.data;

    // Check household auto-approve threshold
    const household = await prisma.household.findUnique({
      where: { id: hid },
      select: { autoApproveUnder: true },
    });

    const autoApprove =
      household?.autoApproveUnder != null &&
      amount < household.autoApproveUnder;

    const request = await prisma.purchaseRequest.create({
      data: {
        householdId: hid,
        requesterId: userId,
        amount,
        vendor,
        category: category ?? null,
        reason,
        neededBy: neededBy ? new Date(neededBy) : null,
        vendorId: vendorId ?? null,
        status: autoApprove ? "APPROVED" : "PENDING",
        approverId: autoApprove ? userId : null,
      },
      include: {
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        receipts: true,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error("[POST /api/approvals]", err);
    return NextResponse.json(
      { error: "Failed to create purchase request" },
      { status: 500 }
    );
  }
}
