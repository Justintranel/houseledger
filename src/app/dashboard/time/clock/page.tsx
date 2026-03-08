import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TimeClock from "@/components/time/TimeClock";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TimeClockPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  // Clock In/Out is only for MANAGER role
  if (!role || role !== "MANAGER") {
    redirect("/dashboard");
  }

  const hid = session!.user.householdId!;
  const userId = session!.user.id!;
  const name = session!.user.name ?? "Worker";

  // Find any running entry for this user
  const running = await prisma.timeEntry.findFirst({
    where: { householdId: hid, workerId: userId, status: "RUNNING" },
    select: { id: true, startAt: true },
  });

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Clock</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your work hours</p>
        </div>
        <Link href="/dashboard/time" className="text-sm text-brand-600 hover:underline">
          View timesheet →
        </Link>
      </div>

      <div className="card p-8">
        <TimeClock
          initialRunning={
            running
              ? { id: running.id, startAt: running.startAt?.toISOString() ?? null }
              : null
          }
          userName={name}
        />
      </div>
    </div>
  );
}
