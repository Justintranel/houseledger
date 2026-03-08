/**
 * GET /api/time/week?from=yyyy-MM-dd&to=yyyy-MM-dd
 *
 * Returns a weekly summary: per-worker totals, payout calculation.
 * OWNER / FAMILY see all workers; MANAGER sees only themselves.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function minutesWorked(
  startAt: Date | null,
  endAt: Date | null,
  startTime: string,
  endTime: string,
  breakMins: number,
): number {
  if (startAt && endAt) {
    // Use precise timestamps when available (clock-in/out)
    return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000) - breakMins);
  }
  // Fallback: string-based HH:MM
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, total - breakMins);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to)
      return NextResponse.json({ error: "from and to required" }, { status: 400 });

    const where: Record<string, unknown> = {
      householdId: auth.householdId,
      status: { in: ["PENDING", "APPROVED"] }, // exclude RUNNING
      date: {
        gte: new Date(from + "T00:00:00"),
        lte: new Date(to + "T23:59:59"),
      },
    };

    if (auth.role === "MANAGER") where.workerId = auth.userId;

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { worker: { select: { id: true, name: true, email: true } } },
      orderBy: [{ date: "asc" }],
    });

    // Fetch worker rates
    const workerIds = Array.from(new Set(entries.map((e) => e.workerId)));
    const rates = await prisma.workerRate.findMany({
      where: { householdId: auth.householdId, userId: { in: workerIds } },
    });
    const rateMap = new Map(rates.map((r) => [r.userId, r.hourlyRateCents]));

    // Build per-worker summary
    const workerMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        totalMinutes: number;
        hourlyRateCents: number;
        approvedMinutes: number;
        pendingMinutes: number;
        entryCount: number;
      }
    >();

    for (const entry of entries) {
      const mins = minutesWorked(
        entry.startAt,
        entry.endAt,
        entry.startTime,
        entry.endTime,
        entry.breakMins,
      );
      if (!workerMap.has(entry.workerId)) {
        workerMap.set(entry.workerId, {
          userId: entry.workerId,
          name: entry.worker.name,
          email: entry.worker.email,
          totalMinutes: 0,
          hourlyRateCents: rateMap.get(entry.workerId) ?? 0,
          approvedMinutes: 0,
          pendingMinutes: 0,
          entryCount: 0,
        });
      }
      const w = workerMap.get(entry.workerId)!;
      w.totalMinutes += mins;
      w.entryCount += 1;
      if (entry.status === "APPROVED") w.approvedMinutes += mins;
      else w.pendingMinutes += mins;
    }

    const workers = Array.from(workerMap.values()).map((w) => ({
      ...w,
      totalHours: Math.round((w.totalMinutes / 60) * 100) / 100,
      payoutCents: Math.round((w.totalMinutes / 60) * w.hourlyRateCents),
    }));

    const grandTotalMinutes = workers.reduce((s, w) => s + w.totalMinutes, 0);
    const grandTotalPayoutCents = workers.reduce((s, w) => s + w.payoutCents, 0);

    return NextResponse.json({
      workers,
      grandTotalHours: Math.round((grandTotalMinutes / 60) * 100) / 100,
      grandTotalPayoutCents,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/time/week]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
