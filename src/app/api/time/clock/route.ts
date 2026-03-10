/**
 * POST /api/time/clock
 * body: { action: "in" | "out", notes?: string }
 *
 * Clock In  → creates a new TimeEntry with status=RUNNING, startAt=now, endAt=null
 * Clock Out → finds the open RUNNING entry, sets endAt=now, computes breakMins, status=PENDING
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { audit } from "@/lib/audit";
import { format } from "date-fns";
import { sendClockInEmail, sendClockOutEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["in", "out"]),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { action, notes } = parsed.data;
    const now = new Date();

    // Fetch household (for name + notification settings) and worker name once
    const [household, worker] = await Promise.all([
      prisma.household.findUnique({
        where: { id: auth.householdId },
        select: { name: true, clockNotifyEmail: true, clockNotifyPhone: true },
      }),
      prisma.user.findUnique({ where: { id: auth.userId }, select: { name: true } }),
    ]);
    const workerName = worker?.name ?? "Your house manager";
    const householdName = household?.name ?? "your household";

    if (action === "in") {
      // Prevent double clock-in
      const existing = await prisma.timeEntry.findFirst({
        where: { householdId: auth.householdId, workerId: auth.userId, status: "RUNNING" },
      });
      if (existing) {
        return NextResponse.json({ error: "Already clocked in" }, { status: 409 });
      }

      const entry = await prisma.timeEntry.create({
        data: {
          householdId: auth.householdId,
          workerId: auth.userId,
          date: now,
          startTime: format(now, "HH:mm"),
          endTime: format(now, "HH:mm"), // placeholder — real times are in startAt/endAt
          startAt: now,
          endAt: null,
          status: "RUNNING",
          notes: notes ?? null,
        },
      });

      await audit({
        householdId: auth.householdId,
        userId: auth.userId,
        action: "CREATE",
        entityType: "TimeEntry",
        entityId: entry.id,
        after: { action: "clock_in", at: now },
        note: "Clocked in",
      });

      // Send notifications (fire-and-forget — don't block response)
      const timeStr = format(now, "h:mm a");
      if (household?.clockNotifyEmail) {
        sendClockInEmail(household.clockNotifyEmail, workerName, timeStr, householdName).catch(
          (e) => console.error("[clock/in] email notification failed:", e),
        );
      }
      if (household?.clockNotifyPhone) {
        sendSms(
          household.clockNotifyPhone,
          `⏱ ${workerName} clocked in at ${timeStr} — ${householdName}`,
        ).catch((e) => console.error("[clock/in] SMS notification failed:", e));
      }

      return NextResponse.json(entry, { status: 201 });
    } else {
      // Clock out
      const running = await prisma.timeEntry.findFirst({
        where: { householdId: auth.householdId, workerId: auth.userId, status: "RUNNING" },
      });
      if (!running) {
        return NextResponse.json({ error: "Not clocked in" }, { status: 409 });
      }

      const updated = await prisma.timeEntry.update({
        where: { id: running.id },
        data: {
          endAt: now,
          endTime: format(now, "HH:mm"),
          status: "PENDING",
          notes: notes !== undefined ? notes : running.notes,
        },
      });

      await audit({
        householdId: auth.householdId,
        userId: auth.userId,
        action: "UPDATE",
        entityType: "TimeEntry",
        entityId: running.id,
        after: { action: "clock_out", at: now },
        note: "Clocked out",
      });

      // Send notifications (fire-and-forget)
      if (household?.clockNotifyEmail || household?.clockNotifyPhone) {
        const clockInStr = running.startAt ? format(running.startAt, "h:mm a") : "—";
        const clockOutStr = format(now, "h:mm a");
        const durationMins = running.startAt
          ? Math.round((now.getTime() - running.startAt.getTime()) / 60000)
          : 0;

        if (household.clockNotifyEmail) {
          sendClockOutEmail(
            household.clockNotifyEmail,
            workerName,
            clockInStr,
            clockOutStr,
            durationMins,
            householdName,
          ).catch((e) => console.error("[clock/out] email notification failed:", e));
        }
        if (household.clockNotifyPhone) {
          const hrs = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          sendSms(
            household.clockNotifyPhone,
            `✅ ${workerName} clocked out at ${clockOutStr} (${dur} shift) — ${householdName}`,
          ).catch((e) => console.error("[clock/out] SMS notification failed:", e));
        }
      }

      return NextResponse.json(updated);
    }
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/time/clock]", err);
    return NextResponse.json({ error: "Failed to update clock" }, { status: 500 });
  }
}

/** GET /api/time/clock — returns the current user's running entry (or null) */
export async function GET(_req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const running = await prisma.timeEntry.findFirst({
      where: { householdId: auth.householdId, workerId: auth.userId, status: "RUNNING" },
    });
    return NextResponse.json({ running: running ?? null });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
