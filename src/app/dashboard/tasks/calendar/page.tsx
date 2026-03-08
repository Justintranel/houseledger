import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInstancesForRange } from "@/lib/tasks";
import { startOfWeek, addDays } from "date-fns";
import TaskCalendarView from "@/components/tasks/TaskCalendarView";

export default async function TasksCalendarPage() {
  const session = await getServerSession(authOptions);
  const hid = session!.user.householdId!;
  const role = session!.user.role!;
  const userId = session!.user.id!;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const initialTasks = await getInstancesForRange(hid, weekStart, weekEnd);

  return (
    <TaskCalendarView
      initialTasks={JSON.parse(JSON.stringify(initialTasks))}
      role={role}
      userId={userId}
    />
  );
}
