"use client";
import { useState } from "react";
import TaskRow from "./TaskRow";
import type { TaskItem } from "@/types/tasks";

interface Props {
  title: string;
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelect: (id: string | null) => void;
  onToggle: (task: TaskItem) => void;
  /** Pass null to hide the inline add widget */
  onAdd: ((title: string) => void) | null;
  danger?: boolean;
}

export default function TaskSection({
  title,
  tasks,
  selectedTaskId,
  onSelect,
  onToggle,
  onAdd,
  danger = false,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    const t = newTitle.trim();
    if (!t || !onAdd) return;
    onAdd(t);
    setNewTitle("");
    setShowAdd(false);
  };

  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <h2
          className={`text-xs font-semibold uppercase tracking-wider ${danger ? "text-red-600" : "text-slate-500"}`}
        >
          {title}
        </h2>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${danger ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}`}
        >
          {tasks.length}
        </span>
        {doneCount > 0 && !danger && (
          <span className="text-xs text-slate-400">
            {doneCount}/{tasks.length} done
          </span>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onClick={() => onSelect(selectedTaskId === task.id ? null : task.id)}
            onToggle={() => onToggle(task)}
          />
        ))}

        {/* Inline add */}
        {onAdd &&
          (showAdd ? (
            <div className="flex gap-2 mt-1">
              <input
                autoFocus
                className="input flex-1 text-sm py-2"
                placeholder="Task title…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setShowAdd(false);
                    setNewTitle("");
                  }
                }}
              />
              <button onClick={handleAdd} className="btn-primary px-4 text-sm py-2">
                Add
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewTitle("");
                }}
                className="btn-secondary px-3 py-2 text-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-1 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition w-full text-left"
            >
              <span className="text-base leading-none">+</span> Add task…
            </button>
          ))}
      </div>
    </div>
  );
}
