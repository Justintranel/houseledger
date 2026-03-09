"use client";
import { useState } from "react";
import PayNowModal from "@/components/payroll/PayNowModal";

export interface WorkerPayout {
  userId: string;
  name: string;
  email: string;
  totalHours: number;
  hourlyRateCents: number;
  payoutCents: number;
  approvedMinutes: number;
  pendingMinutes: number;
}

interface Props {
  workers: WorkerPayout[];
  weekLabel: string;
  grandTotalCents: number;
  grandTotalHours: number;
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatRate(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }) + "/hr";
}

export default function PayrollClient({ workers, weekLabel, grandTotalCents, grandTotalHours }: Props) {
  const [selected, setSelected] = useState<WorkerPayout | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-slate-500 text-sm mt-1">
            Week of {weekLabel} · Approved hours only
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">Total owed</p>
          <p className="text-3xl font-bold text-brand-700">{formatMoney(grandTotalCents)}</p>
          <p className="text-xs text-slate-400">{grandTotalHours.toFixed(1)} hrs across all workers</p>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">⏱️</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No approved time this week</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Once your house manager logs and you approve their time entries, their pay will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Worker
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Hours
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Rate
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Owed
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => (
                <tr key={w.userId} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{w.name}</p>
                    <p className="text-xs text-slate-400">{w.email}</p>
                    {w.pendingMinutes > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        +{(w.pendingMinutes / 60).toFixed(1)} hrs pending approval
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-medium text-slate-800">{w.totalHours.toFixed(2)}</span>
                    <span className="text-slate-400 ml-1 text-xs">hrs</span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {w.hourlyRateCents > 0 ? formatRate(w.hourlyRateCents) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-lg font-bold text-brand-700">{formatMoney(w.payoutCents)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelected(w)}
                      disabled={w.payoutCents === 0}
                      className="btn-primary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Pay Now →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Grand total row */}
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-5 py-3 text-sm font-semibold text-slate-700">
                  Total payroll
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">
                  {grandTotalHours.toFixed(2)} hrs
                </td>
                <td />
                <td className="px-5 py-3 text-right text-xl font-bold text-brand-700">
                  {formatMoney(grandTotalCents)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Info callout */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-lg shrink-0">💡</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">New to household payroll?</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            If you pay your house manager $2,600+ per year, you may be a household employer subject to
            payroll taxes. We recommend{" "}
            <a
              href="https://www.care.com/homepay"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-900"
            >
              Care.com HomePay
            </a>{" "}
            to handle tax filings, direct deposit, and compliance automatically.
          </p>
        </div>
      </div>

      {/* Pay Now Modal */}
      {selected && (
        <PayNowModal
          workerName={selected.name}
          workerEmail={selected.email}
          totalCents={selected.payoutCents}
          totalHours={selected.totalHours}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
