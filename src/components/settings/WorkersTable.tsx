"use client";
import { useState } from "react";

interface Worker {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  hourlyRateCents: number;
  isActive: boolean;
  rateId: string | null;
  workerType?: string;
  isTemporary?: boolean;
}

const WORKER_TYPE_LABELS: Record<string, string> = {
  REGULAR:     "House Manager",
  HOUSE_SITTER: "House Sitter",
  BABY_SITTER:  "Baby Sitter",
  DOG_SITTER:   "Dog Sitter",
  OTHER_TEMP:   "Other Temp",
};

interface Props {
  initialWorkers: Worker[];
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type EditState =
  | { kind: "rate"; userId: string; rateDollars: string }
  | { kind: "name"; userId: string; draft: string }
  | null;

export default function WorkersTable({ initialWorkers }: Props) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [editing, setEditing] = useState<EditState>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSaveRate = async (userId: string) => {
    if (!editing || editing.kind !== "rate" || editing.userId !== userId) return;
    const dollars = parseFloat(editing.rateDollars);
    if (isNaN(dollars) || dollars < 0) { setError("Invalid rate"); return; }
    const cents = Math.round(dollars * 100);
    setSaving(userId);
    setError("");
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hourlyRateCents: cents }),
      });
      if (res.ok) {
        setWorkers((prev) => prev.map((w) => (w.userId === userId ? { ...w, hourlyRateCents: cents } : w)));
        setEditing(null);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
      }
    } finally { setSaving(null); }
  };

  const handleSaveName = async (userId: string) => {
    if (!editing || editing.kind !== "name" || editing.userId !== userId) return;
    const name = editing.draft.trim();
    if (!name) { setError("Name cannot be empty"); return; }
    setSaving(userId);
    setError("");
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });
      if (res.ok) {
        setWorkers((prev) => prev.map((w) => (w.userId === userId ? { ...w, name } : w)));
        setEditing(null);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
      }
    } finally { setSaving(null); }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setSaving(userId);
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      if (res.ok) {
        setWorkers((prev) => prev.map((w) => (w.userId === userId ? { ...w, isActive } : w)));
      }
    } finally { setSaving(null); }
  };

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {workers.length === 0 ? (
        <p className="text-sm text-slate-400">No members yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hourly Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => (
                <tr key={w.userId} className={`hover:bg-slate-50 ${!w.isActive ? "opacity-50" : ""}`}>
                  {/* ── Name cell ── */}
                  <td className="px-4 py-3">
                    {editing?.kind === "name" && editing.userId === w.userId ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          className="input text-sm py-1.5 w-36"
                          value={editing.draft}
                          onChange={(e) => setEditing({ kind: "name", userId: w.userId, draft: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName(w.userId);
                            if (e.key === "Escape") setEditing(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveName(w.userId)}
                          disabled={saving === w.userId}
                          className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          {saving === w.userId ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditing(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 group">
                        <div>
                          <p className="font-medium text-slate-800">{w.name}</p>
                          <p className="text-xs text-slate-400">{w.email}</p>
                        </div>
                        <button
                          onClick={() => setEditing({ kind: "name", userId: w.userId, draft: w.name })}
                          className="opacity-0 group-hover:opacity-100 transition mt-0.5 text-slate-300 hover:text-brand-600"
                          title="Edit name"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>

                  {/* ── Worker type ── */}
                  <td className="px-4 py-3">
                    {w.isTemporary ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {WORKER_TYPE_LABELS[w.workerType ?? ""] ?? w.workerType}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">House Manager</span>
                    )}
                  </td>

                  {/* ── Role ── */}
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{w.role}</span>
                  </td>

                  {/* ── Hourly rate ── */}
                  <td className="px-4 py-3">
                    {w.role !== "MANAGER" ? (
                      <span className="text-sm text-slate-400">—</span>
                    ) : editing?.kind === "rate" && editing.userId === w.userId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">$</span>
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          step={0.01}
                          className="input w-24 text-sm py-1.5"
                          value={editing.rateDollars}
                          onChange={(e) => setEditing({ kind: "rate", userId: w.userId, rateDollars: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRate(w.userId);
                            if (e.key === "Escape") setEditing(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveRate(w.userId)}
                          disabled={saving === w.userId}
                          className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditing(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing({ kind: "rate", userId: w.userId, rateDollars: (w.hourlyRateCents / 100).toFixed(2) })}
                        className="text-sm text-slate-700 hover:text-brand-600 transition group flex items-center gap-1.5"
                      >
                        {w.hourlyRateCents > 0 ? formatMoney(w.hourlyRateCents) + "/hr" : <span className="text-slate-400">Set rate…</span>}
                        <svg className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </td>

                  {/* ── Active toggle ── */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(w.userId, !w.isActive)}
                      disabled={saving === w.userId}
                      className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${w.isActive ? "bg-brand-600" : "bg-slate-200"}`}
                    >
                      <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mt-[3px] ${w.isActive ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
