import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
  workDays: z.array(z.number()).optional(),
  workStart: z.string().optional(),
  workEnd: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  autoApproveUnder: z.number().min(0).optional(),
  requireApprovalOver: z.number().min(0).optional(),
  clockNotifyEmail: z.string().email().optional().nullable(),
  clockNotifyPhone: z.string().max(20).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const household = await prisma.household.findUnique({
      where: { id: hid },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(household);
  } catch (err) {
    console.error("[GET /api/household]", err);
    return NextResponse.json(
      { error: "Failed to load household" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.household.update({
      where: { id: hid },
      data: parsed.data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/household]", err);
    return NextResponse.json(
      { error: "Failed to update household" },
      { status: 500 }
    );
  }
}
