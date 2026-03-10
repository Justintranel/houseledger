"use client";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import CommentsThread from "./CommentsThread";
import RecurrenceEditor from "./RecurrenceEditor";
import type { TaskItem, TaskComment } from "@/types/tasks";

interface Props {
  task: TaskItem;
  role: string;
  userId: string;
  onClose: () => void;
  onUpdate: (updated: TaskItem) => void;
}

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-slate-100 text-slate-400",
};

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Repeats daily",
  WEEKLY: "Repeats weekly",
  MONTHLY: "Repeats monthly",
  SEASONAL: "Seasonal",
  CUSTOM: "Custom recurrence",
};

export default function TaskDetailPanel({ task, role, userId, onClose, onUpdate }: Props) {
  const canEdit = role !== "MANAGER";
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState(task.category ?? "");
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Keep local fields in sync when parent task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setCategory(task.category ?? "");
    setShowRecurrence(false);
  }, [task.id]);

  const isDone = task.status === "DONE";
  const dateStr = task.date.substring(0, 10);
  const hasRecurrence = !!task.taskTemplate?.recurrenceRule;
  const recurrenceLabel = hasRecurrence
    ? (RECURRENCE_LABELS[task.taskTemplate!.recurrenceRule!.type] ?? "Custom")
    : null;

  const patch = async (data: object) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...task, ...updated });
    }
  };

  const handleToggle = () => patch({ status: isDone ? "TODO" : "DONE" });

  const handleSaveTitle = () => {
    if (title.trim() && title !== task.title) patch({ title: title.trim() });
  };

  const handleSaveDescription = () => {
    if (description !== (task.description ?? "")) patch({ description: description || null });
  };

  const handleSaveCategory = () => {
    if (category !== (task.category ?? "")) patch({ category: category.trim() || null });
  };

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    const res = await fetch(`/api/tasks/${task.id}/skip`, { method: "POST" });
    if (res.ok) onUpdate({ ...task, status: "SKIPPED" });
    setSkipping(false);
  };

  const handleCommentAdded = (comment: TaskComment) => {
    onUpdate({ ...task, comments: [...task.comments, comment] });
  };

  return (
    <aside className="w-96 shrink-0 border-l border-slate-200 bg-white h-full overflow-y-auto flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status] ?? "bg-slate-100"}`}>
          {task.status}
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Mark done */}
        <button
          onClick={handleToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm transition
            ${isDone
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-700"
            }`}
        >
          <span
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition
              ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}
          >
            {isDone && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          {isDone ? "Marked complete — click to reopen" : "Mark complete"}
        </button>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Title
          </label>
          {canEdit ? (
            <input
              className="w-full text-sm font-medium text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-400 rounded-lg px-2 py-1.5 outline-none transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
            />
          ) : (
            <p className="text-sm font-medium text-slate-900 px-2 py-1.5">{task.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Description
          </label>
          {canEdit ? (
            <textarea
              className="w-full text-sm text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-400 rounded-lg px-2 py-1.5 outline-none transition resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add a description…"
            />
          ) : (
            <p className="text-sm text-slate-700 px-2 py-1.5">
              {task.description || <span className="text-slate-400">No description</span>}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Date
          </label>
          <p className="text-sm text-slate-700 px-2 py-1.5">
            {format(parseISO(dateStr), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Category
          </label>
          {canEdit ? (
            <input
              className="w-full text-sm text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-400 rounded-lg px-2 py-1.5 outline-none transition"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={handleSaveCategory}
              placeholder="e.g. Cleaning, Kitchen, Outdoor…"
            />
          ) : task.category ? (
            <span className="inline-block text-sm px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {task.category}
            </span>
          ) : (
            <p className="text-sm text-slate-400 px-2 py-1.5">No category</p>
          )}
        </div>

        {/* Duration */}
        {task.taskTemplate?.defaultDuration && (
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Duration
            </label>
            <p className="text-sm text-slate-700 px-2 py-1.5">
              {task.taskTemplate.defaultDuration} minutes
            </p>
          </div>
        )}

        {/* Recurrence */}
        {recurrenceLabel && (
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Recurrence
            </label>
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm text-slate-700">{recurrenceLabel}</p>
              {canEdit && (
                <button
                  onClick={() => setShowRecurrence((v) => !v)}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  {showRecurrence ? "Cancel" : "Edit"}
                </button>
              )}
            </div>
            {showRecurrence && canEdit && (
              <RecurrenceEditor
                taskId={task.id}
                currentType={task.taskTemplate?.recurrenceRule?.type ?? null}
                onSaved={() => setShowRecurrence(false)}
                onCancel={() => setShowRecurrence(false)}
              />
            )}
          </div>
        )}

        {/* Skip occurrence */}
        {hasRecurrence && task.status !== "SKIPPED" && task.status !== "DONE" && (
          <button
            onClick={handleSkip}
            disabled={skipping}
            className="text-sm text-slate-400 hover:text-amber-600 transition flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
            {skipping ? "Skipping…" : "Skip this occurrence"}
          </button>
        )}
      </div>

      {/* Comments */}
      <div className="px-5 py-4 border-t border-slate-200">
        <CommentsThread
          taskId={task.id}
          comments={task.comments}
          userId={userId}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </aside>
  );
}
