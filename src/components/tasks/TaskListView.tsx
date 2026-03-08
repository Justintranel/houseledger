"use client";
import { useState, useMemo, useCallback } from "react";
import { format, isToday, parseISO, startOfToday, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import Link from "next/link";
import TaskSection from "./TaskSection";
import TaskDetailPanel from "./TaskDetailPanel";
import TaskLibraryPanel from "./TaskLibraryPanel";
import type { TaskItem } from "@/types/tasks";

type FilterType = "all" | "today" | "week" | "overdue";
type ViewMode = "list" | "library";

interface Props {
  initialTasks: TaskItem[];
  role: string;
  userId: string;
}

export default function TaskListView({ initialTasks, role, userId }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [filter, setFilter] = useState<FilterType>("today"); // default to Today so list starts focused
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const isOwner = role === "OWNER" || role === "FAMILY";

  const today = startOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter(Boolean) as string[])).sort(),
    [tasks],
  );

  const { overdue, todayTasks, upcoming, later } = useMemo(() => {
    let filtered = tasks;
    if (categoryFilter) filtered = filtered.filter((t) => t.category === categoryFilter);
    if (!showCompleted) filtered = filtered.filter((t) => t.status !== "DONE" && t.status !== "SKIPPED");

    if (filter === "today") filtered = filtered.filter((t) => isToday(parseISO(t.date.substring(0, 10))));
    else if (filter === "week") filtered = filtered.filter((t) => isWithinInterval(parseISO(t.date.substring(0, 10)), { start: weekStart, end: weekEnd }));
    else if (filter === "overdue") filtered = filtered.filter((t) => parseISO(t.date.substring(0, 10)) < today && t.status !== "DONE" && t.status !== "SKIPPED");

    const overdue: TaskItem[] = [], todayTasks: TaskItem[] = [], upcoming: TaskItem[] = [], later: TaskItem[] = [];
    for (const t of filtered) {
      const d = parseISO(t.date.substring(0, 10));
      if (d < today) overdue.push(t);
      else if (isToday(d)) todayTasks.push(t);
      else if (d <= addDays(today, 7)) upcoming.push(t);
      else later.push(t);
    }
    return { overdue, todayTasks, upcoming, later };
  }, [tasks, filter, showCompleted, categoryFilter, today, weekStart, weekEnd]);

  const filterCounts = useMemo(() => ({
    today: tasks.filter((t) => isToday(parseISO(t.date.substring(0, 10))) && t.status === "TODO").length,
    week: tasks.filter((t) => isWithinInterval(parseISO(t.date.substring(0, 10)), { start: weekStart, end: weekEnd }) && t.status === "TODO").length,
    overdue: tasks.filter((t) => parseISO(t.date.substring(0, 10)) < today && t.status !== "DONE" && t.status !== "SKIPPED").length,
  }), [tasks, today, weekStart, weekEnd]);

  const handleToggle = useCallback(async (task: TaskItem) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as TaskItem["status"] } : t)));
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
  }, []);

  const handleAddTask = useCallback(async (title: string, date: string, category?: string, description?: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, category, description }),
    });
    if (res.ok) {
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask as TaskItem]);
    }
  }, []);

  const handleAddFromLibrary = useCallback(
    async (title: string, category: string, description: string | undefined, date: string) => {
      await handleAddTask(title, date, category, description);
    },
    [handleAddTask],
  );

  const handleTaskUpdate = useCallback((updated: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const todayStr = format(today, "yyyy-MM-dd");
  const isEmpty = overdue.length === 0 && todayTasks.length === 0 && upcoming.length === 0 && later.length === 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left sidebar (list mode only) ── */}
      {viewMode === "list" && (
        <aside className="w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filters</h2>

          <nav className="space-y-0.5">
            {(
              [
                { id: "today", label: "Today", count: filterCounts.today, danger: false },
                { id: "all", label: "All Tasks", count: null, danger: false },
                { id: "week", label: "This Week", count: filterCounts.week, danger: false },
                { id: "overdue", label: "Overdue", count: filterCounts.overdue, danger: true },
              ] as { id: FilterType; label: string; count: number | null; danger: boolean }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${filter === item.id ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span>{item.label}</span>
                {item.count !== null && item.count > 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${item.danger ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {categories.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-3">Category</h2>
              <nav className="space-y-0.5">
                <button onClick={() => setCategoryFilter(null)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!categoryFilter ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>All</button>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${categoryFilter === cat ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                    {cat}
                  </button>
                ))}
              </nav>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="w-3.5 h-3.5 accent-brand-600" />
              Show completed
            </label>
          </div>
        </aside>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold text-slate-900">
            {viewMode === "library" ? "Task Library" : isOwner ? "Assign Tasks" : "Tasks"}
          </h1>
          <div className="flex items-center gap-2">
            {isOwner && (
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setViewMode("library")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === "library" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  📚 Library
                </button>
              </div>
            )}
            {viewMode === "list" && (
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-900 shadow-sm">List</span>
                <Link href="/dashboard/tasks/calendar" className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900 transition">
                  Calendar
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Library or list content */}
        {viewMode === "library" ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <TaskLibraryPanel onAddTask={handleAddFromLibrary} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
            {overdue.length > 0 && (
              <TaskSection title="Overdue" tasks={overdue} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} onToggle={handleToggle} onAdd={null} danger />
            )}

            <TaskSection
              title="Today"
              tasks={todayTasks}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
              onToggle={handleToggle}
              onAdd={(title) => handleAddTask(title, todayStr)}
            />

            {(filter === "all" || filter === "week") && upcoming.length > 0 && (
              <TaskSection title="Upcoming" tasks={upcoming} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} onToggle={handleToggle} onAdd={null} />
            )}

            {filter === "all" && later.length > 0 && (
              <TaskSection title="Later" tasks={later} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} onToggle={handleToggle} onAdd={null} />
            )}

            {isEmpty && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-4xl mb-3">✓</p>
                <p className="font-semibold text-slate-600">
                  {filter === "today" ? "No tasks for today yet." : "All caught up!"}
                </p>
                {isOwner && (
                  <p className="text-sm mt-2 text-slate-400">
                    Use the{" "}
                    <button onClick={() => setViewMode("library")} className="text-brand-600 hover:underline">
                      📚 Library
                    </button>{" "}
                    to add common tasks, or type one in the field above.
                  </p>
                )}
                {!isOwner && <p className="text-sm mt-1">No tasks match this filter.</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Detail panel ── */}
      {selectedTask && viewMode === "list" && (
        <TaskDetailPanel task={selectedTask} role={role} userId={userId} onClose={() => setSelectedTaskId(null)} onUpdate={handleTaskUpdate} />
      )}
    </div>
  );
}
