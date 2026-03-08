import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAllFlags } from "@/lib/flags";
import Sidebar from "@/components/portal/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Super Admin has no household — send them to the admin portal
  if ((session.user as any).isSuperAdmin) redirect("/admin");

  const householdId = session.user.householdId!;
  const household = await prisma.household.findUnique({ where: { id: householdId } });
  const flags = await getAllFlags(householdId);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.user.role!} householdName={household?.name || "My Household"} flags={flags} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
