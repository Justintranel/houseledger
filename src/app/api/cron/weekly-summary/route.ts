import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWeeklySummaryEmail, WeeklySummaryData } from "@/lib/email";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel cron calls this every Friday at 9 PM UTC (= ~5 PM ET)
export async function GET(req: NextRequest) {
  // Protect the cron endpoint with the Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // The "week" we are summarizing is Mon–Fri of the current week
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday
    const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

    // Get all active households
    const households = await prisma.household.findMany({
      where: { accountStatus: "ACTIVE" },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    let sent = 0;
    let errors = 0;

    for (const household of households) {
      try {
        const owners = household.members.filter((m) => m.role === "OWNER");
        const managers = household.members.filter((m) => m.role === "MANAGER");

        if (owners.length === 0) continue;

        // Time entries for the week
        const timeEntries = await prisma.timeEntry.findMany({
          where: {
            householdId: household.id,
            startAt: { gte: weekStart, lte: weekEnd },
          },
        });

        // Task instances completed this week
        const tasks = await prisma.taskInstance.findMany({
          where: {
            householdId: household.id,
            completedAt: { gte: weekStart, lte: weekEnd },
          },
        });

        // Pending tasks (not yet done this week)
        const pendingTasks = await prisma.taskInstance.findMany({
          where: {
            householdId: household.id,
            status: { in: ["TODO", "IN_PROGRESS"] },
            date: { gte: weekStart, lte: weekEnd },
          },
        });

        // Notes added this week
        const notes = await prisma.note.findMany({
          where: {
            householdId: household.id,
            createdAt: { gte: weekStart, lte: weekEnd },
          },
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        // Approved purchases this week
        const approvedPurchases = await prisma.purchaseRequest.findMany({
          where: {
            householdId: household.id,
            status: "APPROVED",
            updatedAt: { gte: weekStart, lte: weekEnd },
          },
        });

        // Build manager summaries
        const managerSummaries = managers.map((m) => {
          const managerTime = timeEntries.filter((t) => t.workerId === m.userId);
          const hoursWorked = managerTime.reduce((sum, t) => {
            if (t.startAt && t.endAt) {
              return sum + (t.endAt.getTime() - t.startAt.getTime()) / 3600000;
            }
            return sum;
          }, 0);

          const completedCount = tasks.filter((t) => t.completedByUserId === m.userId).length;
          const pendingCount = pendingTasks.length;

          return {
            name: m.user.name,
            hoursWorked,
            tasksCompleted: completedCount,
            tasksPending: pendingCount,
          };
        });

        const totalApprovedAmount = approvedPurchases.reduce((s, p) => s + p.amount, 0);

        const recentNotes = notes.map((n) => ({
          author: n.author?.name ?? "Unknown",
          content: n.body.slice(0, 120) + (n.body.length > 120 ? "…" : ""),
          date: format(n.createdAt, "MMM d"),
        }));

        const summaryData: WeeklySummaryData = {
          ownerEmail: owners[0].user.email,
          ownerName: owners[0].user.name,
          householdName: household.name,
          weekLabel,
          managers: managerSummaries,
          notesCount: notes.length,
          purchasesApproved: approvedPurchases.length,
          purchasesTotal: totalApprovedAmount,
          recentNotes,
        };

        await sendWeeklySummaryEmail(summaryData);
        sent++;
      } catch (householdErr) {
        console.error(`[weekly-summary] failed for household ${household.id}:`, householdErr);
        errors++;
      }
    }

    return NextResponse.json({ ok: true, sent, errors });
  } catch (err) {
    console.error("[GET /api/cron/weekly-summary]", err);
    return NextResponse.json({ error: "Failed to send weekly summaries" }, { status: 500 });
  }
}
