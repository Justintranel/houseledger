import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CalendarClient from "./CalendarClient";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const hid = (session.user as any).householdId as string;
  const role = (session.user as any).role as string;

  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const events = await prisma.familyEvent.findMany({
    where: {
      householdId: hid,
      startDate: { gte: from, lte: to },
    },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { startDate: "asc" },
  });

  return (
    <CalendarClient
      initialEvents={JSON.parse(JSON.stringify(events))}
      role={role}
    />
  );
}
