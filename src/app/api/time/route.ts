import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM"),
  breakMins: z.number().int().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  breakMins: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { householdId: auth.householdId };

    // MANAGER can only see their own entries
    if (auth.role === "MANAGER") {
      where.workerId = auth.userId;
    }

    if (from || to) {
      const dateFilter: Record<string, unknown> = {};
      if (from) dateFilter.gte = new Date(from + "T00:00:00");
      if (to) dateFilter.lte = new Date(to + "T23:59:59");
      where.date = dateFilter;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      include: {
        worker: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(entries);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/time]", err);
    return NextResponse.json({ error: "Failed to load time entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "time:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { date, startTime, endTime, breakMins, notes } = parsed.data;

    const entry = await prisma.timeEntry.create({
      data: {
        householdId: auth.householdId,
        workerId: auth.userId,
        date: new Date(date + "T12:00:00.000Z"),
        startTime,
        endTime,
        breakMins: breakMins ?? 0,
        notes: notes ?? null,
        status: "PENDING",
      },
      include: {
        worker: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/time]", err);
    return NextResponse.json({ error: "Failed to log time entry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "time:approve"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { id, status, breakMins, notes } = parsed.data;
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry || entry.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {
      status,
      approverId: auth.userId,
      approvedAt: new Date(),
    };
    if (breakMins !== undefined) updateData.breakMins = breakMins;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        worker: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: status === "APPROVED" ? "APPROVE" : "DENY",
      entityType: "TimeEntry",
      entityId: id,
      before: { status: entry.status },
      after: { status },
      note: `Time entry ${status.toLowerCase()} by ${auth.name}`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/time]", err);
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 });
  }
}
