"use client";
import type { TaskItem } from "@/types/tasks";

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  SEASONAL: "Seasonal",
  CUSTOM: "Custom",
};

const CATEGORY_COLORS: Record<string, string> = {
  Cleaning: "bg-sky-100 text-sky-700",
  Maintenance: "bg-amber-100 text-amber-700",
  Garden: "bg-green-100 text-green-700",
  Shopping: "bg-purple-100 text-purple-700",
  Admin: "bg-slate-100 text-slate-700",
  Laundry: "bg-pink-100 text-pink-700",
};

function catColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-600";
}

interface Props {
  task: TaskItem;
  isSelected: boolean;
  onClick: () => void;
  onToggle: () => void;
}

export default function TaskRow({ task, isSelected, onClick, onToggle }: Props) {
  const isDone = task.status === "DONE";
  const isSkipped = task.status === "SKIPPED";
  const recurrenceType = task.taskTemplate?.recurrenceRule?.type;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer
        ${isDone || isSkipped ? "border-slate-100 bg-slate-50/60 opacity-70" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}
        ${isSelected ? "!border-brand-400 ring-1 ring-brand-300 bg-brand-50/20" : ""}`}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all
          ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"}`}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isDone || isSkipped ? "line-through text-slate-400" : "text-slate-800"}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isSkipped && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">
            Skipped
          </span>
        )}
        {task.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor(task.category)}`}>
            {task.category}
          </span>
        )}
        {recurrenceType && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
            {RECURRENCE_LABELS[recurrenceType] ?? recurrenceType}
          </span>
        )}
        {task.taskTemplate?.defaultDuration ? (
          <span className="text-xs text-slate-400">{task.taskTemplate.defaultDuration}m</span>
        ) : null}
        {task.comments.length > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {task.comments.length}
          </span>
        )}
      </div>
    </div>
  );
}
