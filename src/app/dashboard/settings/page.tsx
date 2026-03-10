import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string;
  if (role !== "OWNER") redirect("/dashboard");

  const householdId = session.user.householdId!;

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      id: true,
      name: true,
      address: true,
      workDays: true,
      workStart: true,
      workEnd: true,
      subscriptionStatus: true,
      members: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <SettingsClient
        initialHousehold={
          household
            ? {
                ...household,
                hourlyRate: null,
                workDays: (household.workDays ?? []).map((n) =>
                  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][n] ?? String(n)
                ),
                workStart: household.workStart ?? null,
                workEnd: household.workEnd ?? null,
              }
            : null
        }
      />
    </div>
  );
}
