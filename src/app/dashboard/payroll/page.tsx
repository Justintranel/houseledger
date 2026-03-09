import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { startOfWeek, endOfWeek, format } from "date-fns";
import PayrollClient, { type WorkerPayout } from "./PayrollClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payroll | The House Ledger",
};

function minutesWorked(
  startAt: Date | null,
  endAt: Date | null,
  startTime: string,
  endTime: string,
  breakMins: number
): number {
  if (startAt && endAt) {
    return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000) - breakMins);
  }
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm) - breakMins);
}

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as string;
  if (role !== "OWNER") redirect("/dashboard");

  const householdId = session.user.householdId!;

  // Current week (Sun → Sat)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  // Fetch all time entries for this week (PENDING + APPROVED)
  const entries = await prisma.timeEntry.findMany({
    where: {
      householdId,
      status: { in: ["PENDING", "APPROVED"] },
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      worker: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch worker rates
  const workerIds = Array.from(new Set(entries.map((e) => e.workerId)));
  const rates = await prisma.workerRate.findMany({
    where: { householdId, userId: { in: workerIds } },
  });
  const rateMap = new Map(rates.map((r) => [r.userId, r.hourlyRateCents]));

  // Aggregate per worker
  const workerMap = new Map<string, WorkerPayout & { totalMinutes: number }>();

  for (const entry of entries) {
    const mins = minutesWorked(
      entry.startAt,
      entry.endAt,
      entry.startTime,
      entry.endTime,
      entry.breakMins
    );

    if (!workerMap.has(entry.workerId)) {
      workerMap.set(entry.workerId, {
        userId: entry.workerId,
        name: entry.worker.name,
        email: entry.worker.email,
        totalMinutes: 0,
        totalHours: 0,
        hourlyRateCents: rateMap.get(entry.workerId) ?? 0,
        payoutCents: 0,
        approvedMinutes: 0,
        pendingMinutes: 0,
      });
    }

    const w = workerMap.get(entry.workerId)!;
    w.totalMinutes += mins;
    if (entry.status === "APPROVED") w.approvedMinutes += mins;
    else w.pendingMinutes += mins;
  }

  const workers: WorkerPayout[] = Array.from(workerMap.values()).map((w) => ({
    userId: w.userId,
    name: w.name,
    email: w.email,
    totalHours: Math.round((w.approvedMinutes / 60) * 100) / 100,
    hourlyRateCents: w.hourlyRateCents,
    payoutCents: Math.round((w.approvedMinutes / 60) * w.hourlyRateCents),
    approvedMinutes: w.approvedMinutes,
    pendingMinutes: w.pendingMinutes,
  }));

  const grandTotalCents = workers.reduce((s, w) => s + w.payoutCents, 0);
  const grandTotalHours = workers.reduce((s, w) => s + w.totalHours, 0);

  return (
    <PayrollClient
      workers={workers}
      weekLabel={weekLabel}
      grandTotalCents={grandTotalCents}
      grandTotalHours={Math.round(grandTotalHours * 100) / 100}
    />
  );
}
