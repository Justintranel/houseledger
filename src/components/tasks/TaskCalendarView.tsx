"use client";
import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
} from "date-fns";
import Link from "next/link";
import TaskDetailPanel from "./TaskDetailPanel";
import type { TaskItem } from "@/types/tasks";

type CalView = "week" | "day";

interface Props {
  initialTasks: TaskItem[];
  role: string;
  userId: string;
}

export default function TaskCalendarView({ initialTasks, role, userId }: Props) {
  const [view, setView] = useState<CalView>("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadTasks = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?from=${from}&to=${to}`);
      if (res.ok) setTasks((await res.json()) as TaskItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(addDays(weekStart, 6), "yyyy-MM-dd");
    loadTasks(from, to);
  }, [weekStart, loadTasks]);

  const navigateWeek = (dir: "prev" | "next" | "today") => {
    if (dir === "prev") setWeekStart((prev) => subWeeks(prev, 1));
    else if (dir === "next") setWeekStart((prev) => addWeeks(prev, 1));
    else {
      setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
      setSelectedDay(format(new Date(), "yyyy-MM-dd"));
    }
  };

  const getTasksForDay = (dayStr: string) =>
    tasks.filter((t) => t.date.substring(0, 10) === dayStr);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const handleTaskUpdate = (updated: TaskItem) =>
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const handleToggle = async (task: TaskItem) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as TaskItem["status"] } : t)),
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <div className="flex items-center gap-2">
            {/* Week / Day toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Week
              </button>
              <button
                onClick={() => setView("day")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "day" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Day
              </button>
            </div>

            {/* List / Calendar switcher */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <Link
                href="/dashboard/tasks"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900 transition"
              >
                List
              </Link>
              <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-900 shadow-sm">
                Calendar
              </span>
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateWeek("prev")}
                className="btn-secondary px-2.5 py-1.5 text-sm"
              >
                ←
              </button>
              <button
                onClick={() => navigateWeek("today")}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek("next")}
                className="btn-secondary px-2.5 py-1.5 text-sm"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Calendar body */}
        <div className="flex-1 overflow-auto">
          {view === "week" ? (
            <WeekView
              days={weekDays}
              getTasksForDay={getTasksForDay}
              loading={loading}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onToggle={handleToggle}
            />
          ) : (
            <DayView
              day={selectedDay}
              tasks={getTasksForDay(selectedDay)}
              days={weekDays}
              onSelectDay={setSelectedDay}
              loading={loading}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onToggle={handleToggle}
            />
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          role={role}
          userId={userId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}

/* ─────────────── Week View ─────────────── */
function WeekView({
  days,
  getTasksForDay,
  loading,
  selectedTaskId,
  onSelectTask,
  onToggle,
}: {
  days: Date[];
  getTasksForDay: (d: string) => TaskItem[];
  loading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onToggle: (task: TaskItem) => void;
}) {
  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white sticky top-0 z-10">
        {days.map((day) => {
          const ds = format(day, "yyyy-MM-dd");
          const dayTasks = getTasksForDay(ds);
          const done = dayTasks.filter((t) => t.status === "DONE").length;
          return (
            <div
              key={ds}
              className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday(day) ? "bg-brand-50" : ""}`}
            >
              <p className="text-xs font-medium text-slate-500 uppercase">{format(day, "EEE")}</p>
              <p
                className={`text-xl font-bold mt-0.5 ${isToday(day) ? "text-brand-600" : "text-slate-900"}`}
              >
                {format(day, "d")}
              </p>
              {dayTasks.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {done}/{dayTasks.length}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Task grid */}
      {loading ? (
        <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-96">
          {days.map((day) => {
            const ds = format(day, "yyyy-MM-dd");
            const dayTasks = getTasksForDay(ds);
            return (
              <div
                key={ds}
                className={`p-2 space-y-1.5 ${isToday(day) ? "bg-brand-50/30" : ""}`}
              >
                {dayTasks.map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
                    onToggle={() => onToggle(task)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Day View ─────────────── */
function DayView({
  day,
  tasks,
  days,
  onSelectDay,
  loading,
  selectedTaskId,
  onSelectTask,
  onToggle,
}: {
  day: string;
  tasks: TaskItem[];
  days: Date[];
  onSelectDay: (d: string) => void;
  loading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onToggle: (task: TaskItem) => void;
}) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  return (
    <div>
      {/* Day selector row */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white sticky top-0 z-10">
        {days.map((d) => {
          const ds = format(d, "yyyy-MM-dd");
          const isSelected = ds === day;
          return (
            <button
              key={ds}
              onClick={() => onSelectDay(ds)}
              className={`p-3 text-center transition border-r border-slate-100 last:border-r-0
                ${isSelected ? "bg-brand-600 text-white" : isToday(d) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <p className="text-xs font-medium uppercase">{format(d, "EEE")}</p>
              <p className="text-xl font-bold mt-0.5">{format(d, "d")}</p>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="p-6 max-w-2xl">
        <h2 className="text-sm font-semibold text-slate-500 mb-4">
          {isToday(parseISO(day)) ? "Today" : format(parseISO(day), "EEEE, MMMM d")}
          <span className="ml-2 font-normal text-slate-400">
            ({done}/{tasks.length} done)
          </span>
        </h2>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No tasks for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <CalendarTaskChip
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
                onToggle={() => onToggle(task)}
                fullWidth
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Calendar task chip ─────────────── */
function CalendarTaskChip({
  task,
  isSelected,
  onSelect,
  onToggle,
  fullWidth = false,
}: {
  task: TaskItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  fullWidth?: boolean;
}) {
  const isDone = task.status === "DONE";
  const isSkipped = task.status === "SKIPPED";
  return (
    <button
      onClick={onSelect}
      className={`${fullWidth ? "w-full" : "w-full"} text-left px-2.5 py-2 rounded-lg text-xs font-medium transition group
        ${isDone || isSkipped ? "bg-slate-50 text-slate-400" : "bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:shadow-sm"}
        ${isSelected ? "ring-2 ring-brand-400 border-brand-400" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition
            ${isDone ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-emerald-400"}`}
        >
          {isDone && (
            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className={`truncate ${isDone || isSkipped ? "line-through" : ""}`}>
          {task.title}
        </span>
      </div>
      {task.category && (
        <span className="block mt-1 text-slate-400 truncate">{task.category}</span>
      )}
      {task.taskTemplate?.defaultDuration && (
        <span className="block mt-0.5 text-slate-400">{task.taskTemplate.defaultDuration}m</span>
      )}
    </button>
  );
}
