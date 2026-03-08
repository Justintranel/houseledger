import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import WorkersTable from "@/components/settings/WorkersTable";
import InviteWorkerForm from "@/components/settings/InviteWorkerForm";
import WorkersPageClient from "./WorkersPageClient";

export default async function WorkersSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const hid = session!.user.householdId!;

  // Only OWNER or FAMILY can manage workers
  if (role !== "OWNER" && role !== "FAMILY") redirect("/dashboard/settings");

  const members = await prisma.householdMember.findMany({
    where: { householdId: hid },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const rates = await prisma.workerRate.findMany({ where: { householdId: hid } });
  const rateMap = new Map(rates.map((r) => [r.userId, r]));

  const initialWorkers = members.map((m) => ({
    memberId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role as string,
    hourlyRateCents: rateMap.get(m.user.id)?.hourlyRateCents ?? 0,
    isActive: rateMap.get(m.user.id)?.isActive ?? true,
    rateId: rateMap.get(m.user.id)?.id ?? null,
  }));

  return <WorkersPageClient initialWorkers={initialWorkers} />;
}
