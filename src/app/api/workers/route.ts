/**
 * /api/workers
 *
 * GET  — list all household members with their worker rates
 * POST — invite a worker by email (create membership if email exists as user)
 * PATCH — update a worker's hourly rate or active status
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { audit } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only OWNER (or FAMILY) can manage workers */
function assertCanManage(role: string) {
  if (role !== "OWNER" && role !== "FAMILY") throw new Error("Forbidden");
}

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    assertCanManage(auth.role);

    const members = await prisma.householdMember.findMany({
      where: { householdId: auth.householdId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const rates = await prisma.workerRate.findMany({
      where: { householdId: auth.householdId },
    });
    const rateMap = new Map(rates.map((r) => [r.userId, r]));

    const workers = members.map((m) => ({
      memberId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
      hourlyRateCents: rateMap.get(m.user.id)?.hourlyRateCents ?? 0,
      isActive: rateMap.get(m.user.id)?.isActive ?? true,
      workerType: rateMap.get(m.user.id)?.workerType ?? "REGULAR",
      isTemporary: rateMap.get(m.user.id)?.isTemporary ?? false,
      rateId: rateMap.get(m.user.id)?.id ?? null,
    }));

    return NextResponse.json(workers);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    if ((err as Error).message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const WORKER_TYPES = ["REGULAR", "HOUSE_SITTER", "BABY_SITTER", "DOG_SITTER", "OTHER_TEMP"] as const;

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["MANAGER", "FAMILY"]).default("MANAGER"),
  hourlyRateCents: z.number().int().min(0).default(0),
  workerType: z.enum(WORKER_TYPES).default("REGULAR"),
  isTemporary: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    assertCanManage(auth.role);

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, name, role, hourlyRateCents, workerType, isTemporary } = parsed.data;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    let tmpPassword: string | null = null;
    const isNewUser = !user;

    if (!user) {
      // Create user with a temporary password — they should reset it
      tmpPassword = Math.random().toString(36).slice(-10) + "Aa1!";
      const hash = await bcrypt.hash(tmpPassword, 12);
      user = await prisma.user.create({
        data: { name, email, passwordHash: hash },
      });
    }

    // Check if already a member
    const existing = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: auth.householdId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This person is already a member of the household" },
        { status: 409 },
      );
    }

    const member = await prisma.householdMember.create({
      data: {
        householdId: auth.householdId,
        userId: user.id,
        role,
        invitedByUserId: auth.userId,
      },
    });

    // Create worker rate record
    await prisma.workerRate.upsert({
      where: { householdId_userId: { householdId: auth.householdId, userId: user.id } },
      create: {
        householdId: auth.householdId,
        userId: user.id,
        hourlyRateCents,
        workerType,
        isTemporary,
        updatedByUserId: auth.userId,
      },
      update: { hourlyRateCents, workerType, isTemporary, updatedByUserId: auth.userId },
    });

    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: "ROLE_CHANGE",
      entityType: "HouseholdMember",
      entityId: member.id,
      after: { email, role, hourlyRateCents },
      note: `Invited ${email} as ${role}`,
    });

    // Send invite email if this is a brand-new user
    if (isNewUser && tmpPassword) {
      try {
        const household = await prisma.household.findUnique({
          where: { id: auth.householdId },
          select: { name: true },
        });
        const inviter = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { name: true },
        });
        await sendInviteEmail(
          email,
          inviter?.name ?? "Your household owner",
          household?.name ?? "your household",
          role,
          tmpPassword
        );
      } catch (emailErr) {
        console.error("[workers] invite email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true, memberId: member.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    if ((err as Error).message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[POST /api/workers]", err);
    return NextResponse.json({ error: "Failed to invite worker" }, { status: 500 });
  }
}

const rateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  hourlyRateCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    assertCanManage(auth.role);

    const body = await req.json();
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { userId, name, hourlyRateCents, isActive } = parsed.data;

    // Verify target user is in the same household
    const member = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: auth.householdId, userId } },
    });
    if (!member) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    // Update the user's name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const existing = await prisma.workerRate.findUnique({
      where: { householdId_userId: { householdId: auth.householdId, userId } },
    });

    const updated = await prisma.workerRate.upsert({
      where: { householdId_userId: { householdId: auth.householdId, userId } },
      create: {
        householdId: auth.householdId,
        userId,
        hourlyRateCents: hourlyRateCents ?? 0,
        isActive: isActive ?? true,
        updatedByUserId: auth.userId,
      },
      update: {
        ...(hourlyRateCents !== undefined && { hourlyRateCents }),
        ...(isActive !== undefined && { isActive }),
        updatedByUserId: auth.userId,
      },
    });

    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: "UPDATE",
      entityType: "WorkerRate",
      entityId: updated.id,
      before: { hourlyRateCents: existing?.hourlyRateCents },
      after: { name, hourlyRateCents, isActive },
      note: `Updated worker for userId=${userId}`,
    });

    return NextResponse.json({ ...updated, name: name ?? undefined });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    if ((err as Error).message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[PATCH /api/workers]", err);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
  }
}
