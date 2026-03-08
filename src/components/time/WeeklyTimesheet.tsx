"use client";
import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns";

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: string | null;
  endAt: string | null;
  breakMins: number;
  notes: string | null;
  status: "RUNNING" | "PENDING" | "APPROVED" | "REJECTED";
  worker: { id: string; name: string; email: string };
  approver: { id: string; name: string } | null;
}

interface Props {
  role: string;
  userId: string;
}

function minutesWorked(entry: TimeEntry): number {
  if (entry.startAt && entry.endAt) {
    return Math.max(
      0,
      Math.round((new Date(entry.endAt).getTime() - new Date(entry.startAt).getTime()) / 60000) -
        entry.breakMins,
    );
  }
  const [sh, sm] = entry.startTime.split(":").map(Number);
  const [eh, em] = entry.endTime.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm) - entry.breakMins);
}

function formatHours(mins: number): string {
  return (mins / 60).toFixed(2);
}

const STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function WeeklyTimesheet({ role, userId }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = format(weekStart, "yyyy-MM-dd");
      const to = format(weekEnd, "yyyy-MM-dd");
      const res = await fetch(`/api/time?from=${from}&to=${to}`);
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string, status: "APPROVED" | "REJECTED") => {
    setApproving(id);
    const res = await fetch("/api/time", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    }
    setApproving(null);
  };

  const canApprove = role === "OWNER" || role === "FAMILY";

  const pendingEntries = entries.filter((e) => e.status === "PENDING");
  const otherEntries = entries.filter((e) => e.status !== "PENDING");
  const totalMins = entries
    .filter((e) => e.status !== "RUNNING" && e.endAt !== null && e.endTime !== e.startTime)
    .reduce((s, e) => s + minutesWorked(e), 0);

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setWeekStart((p) => subWeeks(p, 1))}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </span>
        <button
          onClick={() => setWeekStart((p) => addWeeks(p, 1))}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          →
        </button>
        <button
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="btn-secondary px-3 py-1.5 text-xs ml-2"
        >
          This week
        </button>
      </div>

      {/* Summary */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card p-3">
            <p className="text-xs text-slate-500">Total Hours</p>
            <p className="text-xl font-bold text-slate-900">{formatHours(totalMins)}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="text-xl font-bold text-slate-900">{entries.length}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-amber-600">Pending Approval</p>
            <p className="text-xl font-bold text-amber-600">{pendingEntries.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No time entries this week.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {role !== "MANAGER" && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Worker
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Start
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  End
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Hours
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                {canApprove && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const mins = entry.status !== "RUNNING" ? minutesWorked(entry) : null;
                const displayStart = entry.startAt
                  ? format(new Date(entry.startAt), "HH:mm")
                  : entry.startTime;
                const displayEnd = entry.endAt
                  ? format(new Date(entry.endAt), "HH:mm")
                  : entry.status === "RUNNING"
                    ? "—"
                    : entry.endTime;

                return (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    {role !== "MANAGER" && (
                      <td className="px-4 py-3 text-slate-700 font-medium">{entry.worker.name}</td>
                    )}
                    <td className="px-4 py-3 text-slate-600">
                      {format(parseISO(entry.date.substring(0, 10)), "EEE, MMM d")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{displayStart}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{displayEnd}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {mins !== null ? formatHours(mins) : <span className="text-blue-500 animate-pulse">Running…</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[entry.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    {canApprove && (
                      <td className="px-4 py-3">
                        {entry.status === "PENDING" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleApprove(entry.id, "APPROVED")}
                              disabled={approving === entry.id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition font-medium disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(entry.id, "REJECTED")}
                              disabled={approving === entry.id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {entry.approver ? `By ${entry.approver.name}` : "—"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
