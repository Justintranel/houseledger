import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInstancesForRange } from "@/lib/tasks";
import { subDays, addDays, startOfToday } from "date-fns";
import TaskListView from "@/components/tasks/TaskListView";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const hid = session!.user.householdId!;
  const role = session!.user.role!;
  const userId = session!.user.id!;

  const today = startOfToday();
  // Load 30 days back (overdue) + 60 days forward (upcoming + later)
  const from = subDays(today, 30);
  const to = addDays(today, 60);

  const initialTasks = await getInstancesForRange(hid, from, to);

  return (
    <TaskListView
      initialTasks={JSON.parse(JSON.stringify(initialTasks))}
      role={role}
      userId={userId}
    />
  );
}
