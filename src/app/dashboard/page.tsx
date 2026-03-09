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
  const role = session!.user.role!;

  const [todayTasks, openQuestions, pendingApprovals, pendingTime] = await Promise.all([
    getInstancesForRange(hid, today, endOfToday()),
    prisma.question.count({ where: { householdId: hid, status: "OPEN" } }),
    prisma.purchaseRequest.count({ where: { householdId: hid, status: "PENDING" } }),
    prisma.timeEntry.count({ where: { householdId: hid, status: "PENDING" } }),
  ]);

  const doneTasks = todayTasks.filter((t) => t.status === "DONE").length;
  const totalTasks = todayTasks.length;

  // Fetch house manager for OWNER/FAMILY dashboard
  let manager: { name: string; email: string; phone: string | null; profileImageUrl: string | null } | null = null;
  if (role === "OWNER" || role === "FAMILY") {
    const managerMember = await prisma.householdMember.findFirst({
      where: { householdId: hid, role: "MANAGER" },
      include: {
        user: { select: { name: true, email: true, phone: true, profileImageUrl: true } },
      },
    });
    if (managerMember) {
      manager = managerMember.user;
    }
  }

  // Fetch owner info for MANAGER dashboard
  let owner: { name: string; email: string; phone: string | null; profileImageUrl: string | null } | null = null;
  if (role === "MANAGER") {
    const ownerMember = await prisma.householdMember.findFirst({
      where: { householdId: hid, role: "OWNER" },
      include: {
        user: { select: { name: true, email: true, phone: true, profileImageUrl: true } },
      },
    });
    if (ownerMember) {
      owner = ownerMember.user;
    }
  }

  const greeting =
    new Date().getHours() < 12 ? "morning" :
    new Date().getHours() < 17 ? "afternoon" : "evening";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {greeting}, {session!.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 text-sm">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Summary cards — left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Today's tasks */}
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

        {/* Right column — manager/owner card */}
        <div className="space-y-4">
          {/* House Manager card (shown to OWNER and FAMILY) */}
          {(role === "OWNER" || role === "FAMILY") && (
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Your House Manager</p>
              {manager ? (
                <div className="text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-3">
                    {manager.profileImageUrl ? (
                      <img
                        src={manager.profileImageUrl}
                        alt={manager.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-brand-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-md ring-2 ring-brand-100">
                        {manager.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{manager.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">House Manager</p>
                  <div className="space-y-2 text-sm">
                    {manager.phone && (
                      <a
                        href={`tel:${manager.phone}`}
                        className="flex items-center justify-center gap-2 text-brand-600 hover:text-brand-800 font-medium transition"
                      >
                        <span>📞</span> {manager.phone}
                      </a>
                    )}
                    <a
                      href={`mailto:${manager.email}`}
                      className="flex items-center justify-center gap-2 text-slate-500 hover:text-brand-600 transition text-xs truncate"
                    >
                      <span>✉️</span>
                      <span className="truncate">{manager.email}</span>
                    </a>
                  </div>
                  {!manager.phone && (
                    <p className="text-xs text-slate-300 mt-3 italic">
                      Manager hasn&apos;t added a phone number yet
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-3xl mb-2">🤝</p>
                  <p className="text-sm text-slate-500 mb-3">No house manager assigned yet</p>
                  <Link href="/dashboard/hire" className="text-xs text-brand-600 hover:underline font-medium">
                    Hire a House Manager →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Employer card (shown to MANAGER) */}
          {role === "MANAGER" && owner && (
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Your Employer</p>
              <div className="text-center">
                {owner.profileImageUrl ? (
                  <img
                    src={owner.profileImageUrl}
                    alt={owner.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-brand-100 mx-auto mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-bold shadow-md mx-auto mb-3">
                    {owner.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <h3 className="font-bold text-slate-900 text-base">{owner.name}</h3>
                <p className="text-xs text-slate-400 mb-3">Household Owner</p>
                <div className="space-y-2 text-sm">
                  {owner.phone && (
                    <a href={`tel:${owner.phone}`} className="flex items-center justify-center gap-2 text-brand-600 hover:text-brand-800 font-medium transition">
                      <span>📞</span> {owner.phone}
                    </a>
                  )}
                  <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-2 text-slate-500 hover:text-brand-600 transition text-xs truncate">
                    <span>✉️</span>
                    <span className="truncate">{owner.email}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Quick Links</p>
            <div className="space-y-1">
              {[
                { href: "/dashboard/vendors", icon: "🔨", label: "Vendor Directory" },
                { href: "/dashboard/maintenance", icon: "🔩", label: "Maintenance Log" },
                { href: "/dashboard/inventory", icon: "📦", label: "Inventory" },
                { href: "/dashboard/notes", icon: "📝", label: "Notes" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition"
                >
                  <span>{link.icon}</span> {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
