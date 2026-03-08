"use client";
import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";

interface WorkerSummary {
  userId: string;
  name: string;
  email: string;
  totalMinutes: number;
  totalHours: number;
  hourlyRateCents: number;
  payoutCents: number;
  approvedMinutes: number;
  pendingMinutes: number;
  entryCount: number;
}

interface WeekData {
  workers: WorkerSummary[];
  grandTotalHours: number;
  grandTotalPayoutCents: number;
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatRate(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }) + "/hr";
}

interface Props {
  role: string;
}

export default function PayoutSummary({ role }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = format(weekStart, "yyyy-MM-dd");
      const to = format(weekEnd, "yyyy-MM-dd");
      const res = await fetch(`/api/time/week?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportCSV = () => {
    if (!data) return;
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    window.open(`/api/export/time?from=${from}&to=${to}`, "_blank");
  };

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
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

        <button onClick={handleExportCSV} className="btn-secondary text-sm px-4 py-2">
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
      ) : !data || data.workers.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm">No approved time this week.</p>
        </div>
      ) : (
        <>
          {/* Grand totals */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-slate-900">{data.grandTotalHours.toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Total Payout</p>
              <p className="text-2xl font-bold text-emerald-700">
                {formatMoney(data.grandTotalPayoutCents)}
              </p>
            </div>
          </div>

          {/* Per-worker table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Worker
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Hours
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Approved
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.workers.map((w) => (
                  <tr key={w.userId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {w.hourlyRateCents > 0 ? formatRate(w.hourlyRateCents) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {w.totalHours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(w.approvedMinutes / 60).toFixed(2)}h
                      {w.pendingMinutes > 0 && (
                        <span className="ml-1 text-xs text-amber-600">
                          (+{(w.pendingMinutes / 60).toFixed(1)} pending)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {w.hourlyRateCents > 0 ? formatMoney(w.payoutCents) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Total
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {data.grandTotalHours.toFixed(2)}
                  </td>
                  <td />
                  <td className="px-4 py-3 font-bold text-emerald-700">
                    {formatMoney(data.grandTotalPayoutCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
