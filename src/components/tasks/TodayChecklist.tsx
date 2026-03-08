"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { TaskItem } from "@/types/tasks";

interface Props {
  initialTasks: TaskItem[];
  role: string;
  userId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Cleaning: "bg-sky-100 text-sky-700",
  Maintenance: "bg-amber-100 text-amber-700",
  Garden: "bg-green-100 text-green-700",
  Shopping: "bg-purple-100 text-purple-700",
  Admin: "bg-slate-100 text-slate-700",
  Laundry: "bg-pink-100 text-pink-700",
};

export default function TodayChecklist({ initialTasks, role, userId }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const todo = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");
  const skipped = tasks.filter((t) => t.status === "SKIPPED");
  const progress = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  const handleToggle = async (task: TaskItem) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as TaskItem["status"] } : t)),
    );
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Today&apos;s Checklist</h1>
        <p className="text-slate-500 text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {done.length} of {tasks.length} tasks complete
            </span>
            <span
              className={`text-sm font-bold ${progress === 100 ? "text-emerald-600" : "text-brand-600"}`}
            >
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-brand-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Remaining tasks */}
      {todo.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            To Do ({todo.length})
          </h2>
          <div className="space-y-2">
            {todo.map((task) => (
              <TaskChecklistRow key={task.id} task={task} onToggle={() => handleToggle(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Done ({done.length})
          </h2>
          <div className="space-y-2">
            {done.map((task) => (
              <TaskChecklistRow key={task.id} task={task} onToggle={() => handleToggle(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-slate-600">No tasks today!</p>
          <p className="text-sm mt-1">Enjoy your day.</p>
        </div>
      )}

      {/* All done celebration */}
      {tasks.length > 0 && progress === 100 && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold text-emerald-700">All done for today!</p>
        </div>
      )}
    </div>
  );
}

function TaskChecklistRow({
  task,
  onToggle,
}: {
  task: TaskItem;
  onToggle: () => void;
}) {
  const isDone = task.status === "DONE";
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition
        ${isDone ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"}`}
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition
          ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"}`}
      >
        {isDone && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
        )}
      </div>
      {task.category && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[task.category] ?? "bg-slate-100 text-slate-600"}`}
        >
          {task.category}
        </span>
      )}
      {task.taskTemplate?.defaultDuration && (
        <span className="text-xs text-slate-400 shrink-0">
          {task.taskTemplate.defaultDuration}m
        </span>
      )}
    </button>
  );
}
