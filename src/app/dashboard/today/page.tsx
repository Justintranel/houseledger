import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInstancesForRange } from "@/lib/tasks";
import { startOfToday, endOfToday } from "date-fns";
import TodayChecklist from "@/components/tasks/TodayChecklist";

export default async function TodayPage() {
  const session = await getServerSession(authOptions);
  const hid = session!.user.householdId!;
  const role = session!.user.role!;
  const userId = session!.user.id!;

  const tasks = await getInstancesForRange(hid, startOfToday(), endOfToday());

  return (
    <TodayChecklist
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      role={role}
      userId={userId}
    />
  );
}
