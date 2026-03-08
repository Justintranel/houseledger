// Shared TypeScript types for the Tasks module

export interface TaskComment {
  id: string;
  taskInstanceId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface TaskItem {
  id: string;
  householdId: string;
  taskTemplateId: string | null;
  date: string; // ISO string — always use .substring(0,10) for date comparisons
  title: string;
  description: string | null;
  category: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  completedAt: string | null;
  completedByUserId: string | null;
  completedBy: { id: string; name: string } | null;
  taskTemplate: {
    id: string;
    defaultDuration: number | null;
    recurrenceRule: { type: string } | null;
    isOneOff: boolean;
  } | null;
  comments: TaskComment[];
}
