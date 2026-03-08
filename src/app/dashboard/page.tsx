import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInstancesForRange } from "@/lib/tasks";
import { startOfToday, endOfToday, format } from "date-fns";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const hid = session!.user.householdId!;
  const today = startOfToday();

  const [todayTasks, openQuestions, pendingApprovals, pendingTime] = await Promise.all([
    getInstancesForRange(hid, today, endOfToday()),
    prisma.question.count({ where: { householdId: hid, status: "OPEN" } }),
    prisma.purchaseRequest.count({ where: { householdId: hid, status: "PENDING" } }),
    prisma.timeEntry.count({ where: { householdId: hid, status: "PENDING" } }),
  ]);

  const doneTasks = todayTasks.filter((t) => t.status === "DONE").length;
  const totalTasks = todayTasks.length;

  const role = session!.user.role!;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {session!.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 text-sm">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/tasks" className="card p-4 hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Today&apos;s Tasks</p>
          <p className="text-2xl font-bold text-slate-900">{doneTasks}/{totalTasks}</p>
          <p className="text-xs text-slate-400 mt-1">{totalTasks - doneTasks} remaining</p>
        </Link>
        <Link href="/dashboard/notes" className="card p-4 hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Open Questions</p>
          <p className="text-2xl font-bold text-slate-900">{openQuestions}</p>
          <p className="text-xs text-slate-400 mt-1">awaiting answer</p>
        </Link>
        {role !== "MANAGER" && (
          <Link href="/dashboard/approvals" className="card p-4 hover:shadow-md transition">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-600">{pendingApprovals}</p>
            <p className="text-xs text-slate-400 mt-1">need review</p>
          </Link>
        )}
        {role !== "MANAGER" && (
          <Link href="/dashboard/time" className="card p-4 hover:shadow-md transition">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Time Entries</p>
            <p className="text-2xl font-bold text-slate-900">{pendingTime}</p>
            <p className="text-xs text-slate-400 mt-1">pending approval</p>
          </Link>
        )}
      </div>

      {/* Today's tasks quick view */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Today&apos;s Tasks</h2>
          <Link href="/dashboard/tasks" className="text-sm text-brand-600 hover:underline">View calendar →</Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-slate-400">No tasks for today.</p>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${t.status === "DONE" ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                  {t.status === "DONE" && <span className="text-white text-xs">✓</span>}
                </span>
                <span className={`text-sm flex-1 ${t.status === "DONE" ? "line-through text-slate-400" : "text-slate-700"}`}>{t.title}</span>
                {t.category && <span className="badge badge-slate text-xs">{t.category}</span>}
              </div>
            ))}
            {todayTasks.length > 8 && (
              <p className="text-xs text-slate-400 pt-1">+ {todayTasks.length - 8} more</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
