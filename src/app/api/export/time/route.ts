import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function minutesWorked(
  startAt: Date | null,
  endAt: Date | null,
  startTime: string,
  endTime: string,
  breakMins: number,
): number {
  if (startAt && endAt) {
    return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000) - breakMins);
  }
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm) - breakMins);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {
      householdId: auth.householdId,
      status: { in: ["PENDING", "APPROVED"] },
    };

    if (from && to) {
      where.date = {
        gte: new Date(from + "T00:00:00"),
        lte: new Date(to + "T23:59:59"),
      };
    }

    if (auth.role === "MANAGER") where.workerId = auth.userId;

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { worker: { select: { id: true, name: true, email: true } } },
    });

    // Fetch worker rates
    const workerIds = Array.from(new Set(entries.map((e) => e.workerId)));
    const rates = await prisma.workerRate.findMany({
      where: { householdId: auth.householdId, userId: { in: workerIds } },
    });
    const rateMap = new Map(rates.map((r) => [r.userId, r.hourlyRateCents]));

    const headers = ["Date", "Worker", "Email", "Start", "End", "Break(mins)", "Hours", "Rate", "Pay", "Status"];

    const rows = entries.map((entry) => {
      const mins = minutesWorked(entry.startAt, entry.endAt, entry.startTime, entry.endTime, entry.breakMins);
      const hours = mins / 60;
      const rateCents = rateMap.get(entry.workerId) ?? 0;
      const payCents = Math.round(hours * rateCents);
      const displayStart = entry.startAt
        ? format(entry.startAt, "HH:mm")
        : entry.startTime;
      const displayEnd = entry.endAt
        ? format(entry.endAt, "HH:mm")
        : entry.endTime;

      return [
        escapeCSV(entry.date.toISOString().slice(0, 10)),
        escapeCSV(entry.worker.name),
        escapeCSV(entry.worker.email),
        escapeCSV(displayStart),
        escapeCSV(displayEnd),
        escapeCSV(entry.breakMins),
        escapeCSV(hours.toFixed(2)),
        escapeCSV(rateCents > 0 ? `$${(rateCents / 100).toFixed(2)}/hr` : "—"),
        escapeCSV(payCents > 0 ? `$${(payCents / 100).toFixed(2)}` : "—"),
        escapeCSV(entry.status),
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timesheet-${from ?? "all"}-${to ?? "all"}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/export/time]", err);
    return NextResponse.json({ error: "Failed to export time entries" }, { status: 500 });
  }
}
