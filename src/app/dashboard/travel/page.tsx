"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  sortOrder: number;
}

interface TravelPlan {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  budgetCents: number | null;
  notes: string | null;
  status: string;
  checklist: ChecklistItem[];
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  PLANNING: "badge-yellow",
  BOOKED: "badge-blue",
  COMPLETED: "badge-green",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planning",
  BOOKED: "Booked",
  COMPLETED: "Completed",
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  const s = format(new Date(start), "MMM d, yyyy");
  if (!end) return s;
  return `${s} – ${format(new Date(end), "MMM d, yyyy")}`;
}

function formatBudget(cents: number | null): string {
  if (cents == null) return "No budget set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function TravelPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const [trips, setTrips] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TravelPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState<TravelPlan | null>(null);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDestination, setFDestination] = useState("");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fBudget, setFBudget] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fStatus, setFStatus] = useState("PLANNING");
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState("");

  // Checklist new item
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  async function fetchTrips() {
    setLoading(true);
    try {
      const res = await fetch("/api/travel");
      if (res.ok) setTrips(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTrips(); }, []);

  function openAdd() {
    setEditTrip(null);
    setFTitle(""); setFDestination(""); setFStartDate(""); setFEndDate("");
    setFBudget(""); setFNotes(""); setFStatus("PLANNING"); setFError("");
    setShowForm(true);
  }

  function openEdit(t: TravelPlan) {
    setEditTrip(t);
    setFTitle(t.title);
    setFDestination(t.destination ?? "");
    setFStartDate(t.startDate ? t.startDate.slice(0, 10) : "");
    setFEndDate(t.endDate ? t.endDate.slice(0, 10) : "");
    setFBudget(t.budgetCents != null ? (t.budgetCents / 100).toFixed(2) : "");
    setFNotes(t.notes ?? "");
    setFStatus(t.status);
    setFError("");
    setShowForm(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFError(""); setFSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: fTitle.trim(),
        status: fStatus,
      };
      if (fDestination) body.destination = fDestination.trim();
      if (fStartDate) body.startDate = fStartDate;
      if (fEndDate) body.endDate = fEndDate;
      if (fBudget) body.budgetCents = Math.round(parseFloat(fBudget) * 100);
      if (fNotes) body.notes = fNotes.trim();

      const res = await fetch(editTrip ? `/api/travel/${editTrip.id}` : "/api/travel", {
        method: editTrip ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        await fetchTrips();
        if (selectedTrip && editTrip?.id === selectedTrip.id) {
          const updated = await res.json();
          setSelectedTrip(updated);
        }
      } else {
        const data = await res.json();
        setFError(data.error ?? "Failed to save trip.");
      }
    } finally {
      setFSubmitting(false);
    }
  }

  async function deleteTrip(id: string) {
    if (!confirm("Delete this trip and all its checklist items?")) return;
    const res = await fetch(`/api/travel/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedTrip?.id === id) setSelectedTrip(null);
      await fetchTrips();
    }
  }

  async function addChecklistItem(tripId: string) {
    if (!newItem.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/travel/${tripId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItem.trim() }),
      });
      if (res.ok) {
        const item = await res.json();
        setSelectedTrip(prev => prev ? { ...prev, checklist: [...prev.checklist, item] } : prev);
        setTrips(prev => prev.map(t => t.id === tripId
          ? { ...t, checklist: [...t.checklist, item] } : t));
        setNewItem("");
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function toggleChecklistItem(tripId: string, itemId: string, completed: boolean) {
    // Optimistic update
    setSelectedTrip(prev => prev ? {
      ...prev,
      checklist: prev.checklist.map(c => c.id === itemId ? { ...c, completed } : c),
    } : prev);
    setTrips(prev => prev.map(t => t.id === tripId ? {
      ...t,
      checklist: t.checklist.map(c => c.id === itemId ? { ...c, completed } : c),
    } : t));

    const res = await fetch(`/api/travel/${tripId}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, completed }),
    });
    if (!res.ok) {
      // Revert on failure
      setSelectedTrip(prev => prev ? {
        ...prev,
        checklist: prev.checklist.map(c => c.id === itemId ? { ...c, completed: !completed } : c),
      } : prev);
    }
  }

  async function deleteChecklistItem(tripId: string, itemId: string) {
    const res = await fetch(`/api/travel/${tripId}/checklist?itemId=${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedTrip(prev => prev ? {
        ...prev, checklist: prev.checklist.filter(c => c.id !== itemId),
      } : prev);
      setTrips(prev => prev.map(t => t.id === tripId
        ? { ...t, checklist: t.checklist.filter(c => c.id !== itemId) } : t));
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Travel ✈️</h1>
          <p className="text-slate-500 text-sm mt-0.5">Plan and track your family trips together.</p>
        </div>
        {canWrite && (
          <button onClick={openAdd} className="btn-primary text-sm">+ New Trip</button>
        )}
      </div>

      {/* Trips grid */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading trips…</p>
      ) : trips.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">✈️</p>
          <p className="font-medium text-slate-600">No trips planned yet.</p>
          {canWrite && (
            <button onClick={openAdd} className="mt-4 btn-primary text-sm">Plan Your First Trip →</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((t) => {
            const done = t.checklist.filter(c => c.completed).length;
            const total = t.checklist.length;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTrip(t)}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{t.title}</h3>
                    {t.destination && (
                      <p className="text-sm text-slate-500 truncate">📍 {t.destination}</p>
                    )}
                  </div>
                  <span className={`badge ${STATUS_BADGE[t.status] ?? "badge-slate"} ml-2 shrink-0`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  📅 {formatDateRange(t.startDate, t.endDate)}
                </p>
                {t.budgetCents != null && (
                  <p className="text-xs text-slate-500 mb-2">💰 {formatBudget(t.budgetCents)}</p>
                )}
                {total > 0 && (
                  <div className="mt-2 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-medium">
                        {done === total && total > 0 ? "✓" : "◦"} {done}/{total} items
                      </span>
                      <span className="text-slate-400">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-brand-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTrip(t); }}
                    className="w-full text-sm text-brand-600 font-medium hover:text-brand-700 text-center py-1 rounded-lg hover:bg-brand-50 transition"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">{selectedTrip.title}</h2>
                  {selectedTrip.destination && (
                    <p className="text-sm text-slate-500">📍 {selectedTrip.destination}</p>
                  )}
                </div>
                <button onClick={() => setSelectedTrip(null)} className="text-slate-400 hover:text-slate-600 ml-4 mt-0.5 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {canWrite && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedTrip(null); openEdit(selectedTrip); }}
                    className="btn-secondary text-sm py-1.5 px-4"
                  >
                    ✏️ Edit Trip
                  </button>
                  <button
                    onClick={() => deleteTrip(selectedTrip.id)}
                    className="text-sm text-red-500 font-medium hover:text-red-700 px-4 py-1.5 rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition"
                  >
                    🗑 Delete Trip
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <span className={`badge ${STATUS_BADGE[selectedTrip.status] ?? "badge-slate"}`}>
                    {STATUS_LABEL[selectedTrip.status] ?? selectedTrip.status}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Dates</p>
                  <p className="font-medium text-slate-700 text-xs">{formatDateRange(selectedTrip.startDate, selectedTrip.endDate)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Budget</p>
                  <p className="font-medium text-slate-700 text-xs">{formatBudget(selectedTrip.budgetCents)}</p>
                </div>
              </div>
              {selectedTrip.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{selectedTrip.notes}</p>
                </div>
              )}
              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Checklist
                    {selectedTrip.checklist.length > 0 && (
                      <span className="ml-2 normal-case font-normal text-slate-400">
                        ({selectedTrip.checklist.filter(c => c.completed).length}/{selectedTrip.checklist.length} done)
                      </span>
                    )}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addChecklistItem(selectedTrip.id)}
                      placeholder="Add a checklist item…"
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={() => addChecklistItem(selectedTrip.id)}
                      disabled={addingItem || !newItem.trim()}
                      className="btn-primary text-sm px-4 whitespace-nowrap"
                    >+ Add item</button>
                  </div>
                )}
                {selectedTrip.checklist.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No items yet. Add one above.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedTrip.checklist.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 group">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => toggleChecklistItem(selectedTrip.id, item.id, e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 cursor-pointer"
                          disabled={!canWrite}
                        />
                        <span className={`flex-1 text-sm ${item.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {item.item}
                        </span>
                        {canWrite && (
                          <button
                            onClick={() => deleteChecklistItem(selectedTrip.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition text-xs"
                          >✕</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editTrip ? "Edit Trip" : "New Trip"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Trip Name *</label>
                <input type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="input w-full" required placeholder="Summer Vacation 2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                <input type="text" value={fDestination} onChange={(e) => setFDestination(e.target.value)} className="input w-full" placeholder="Paris, France" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                  <input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Budget ($)</label>
                  <input type="number" value={fBudget} onChange={(e) => setFBudget(e.target.value)} className="input w-full" min="0" step="0.01" placeholder="5000.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="input w-full">
                    <option value="PLANNING">Planning</option>
                    <option value="BOOKED">Booked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3} className="input w-full resize-none" placeholder="Hotel links, flight info, activities…" />
              </div>
              {fError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={fSubmitting} className="btn-primary text-sm">
                  {fSubmitting ? "Saving…" : editTrip ? "Save Changes" : "Create Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
