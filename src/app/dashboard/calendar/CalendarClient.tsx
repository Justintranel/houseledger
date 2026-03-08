"use client";

import { useState, useCallback, useEffect } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  color: string | null;
  createdBy: { id: string; name: string };
}

interface GCalEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  allDay: boolean;
  description?: string;
}

interface Props {
  initialEvents: CalendarEvent[];
  role: string;
}

const PRESET_COLORS = [
  "#1d4ed8", // blue
  "#059669", // green
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#db2777", // pink
];

export default function CalendarClient({ initialEvents, role }: Props) {
  const canWrite = role === "OWNER" || role === "FAMILY";
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefillDate, setPrefillDate] = useState("");
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fAllDay, setFAllDay] = useState(true);
  const [fColor, setFColor] = useState(PRESET_COLORS[0]);
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState("");

  // Google Calendar state
  const [gcal, setGcal] = useState<{ icalUrl: string; calendarName: string | null } | null>(null);
  const [gcalLoading, setGcalLoading] = useState(true);
  const [gcalInput, setGcalInput] = useState("");
  const [gcalSaving, setGcalSaving] = useState(false);
  const [gcalError, setGcalError] = useState("");
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);

  // Derived date strings for the current month view
  const fromStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const toStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  // Fetch GCal settings on mount
  useEffect(() => {
    fetch("/api/google-calendar")
      .then(r => r.json())
      .then(data => { setGcal(data); setGcalLoading(false); })
      .catch(() => setGcalLoading(false));
  }, []);

  const fetchEvents = useCallback(async (month: Date) => {
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(month), "yyyy-MM-dd");
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
    if (res.ok) setEvents(await res.json());
  }, []);

  async function fetchGcalEvents(from: string, to: string) {
    try {
      const res = await fetch(`/api/google-calendar/events?from=${from}&to=${to}`);
      if (res.ok) setGcalEvents(await res.json());
    } catch { /* ignore */ }
  }

  async function goToMonth(newMonth: Date) {
    setCurrentMonth(newMonth);
    const from = format(startOfMonth(newMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(newMonth), "yyyy-MM-dd");
    await fetchEvents(newMonth);
    await fetchGcalEvents(from, to);
  }

  // Fetch GCal events on initial mount (alongside initial local events)
  useEffect(() => {
    fetchGcalEvents(fromStr, toStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectGcal() {
    setGcalSaving(true); setGcalError("");
    const res = await fetch("/api/google-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icalUrl: gcalInput.trim(), calendarName: "Google Calendar" }),
    });
    if (res.ok) {
      const data = await res.json();
      setGcal(data);
      setGcalInput("");
      fetchGcalEvents(fromStr, toStr);
    } else {
      const err = await res.json();
      setGcalError(err.error || "Failed to connect.");
    }
    setGcalSaving(false);
  }

  async function disconnectGcal() {
    await fetch("/api/google-calendar", { method: "DELETE" });
    setGcal(null);
    setGcalEvents([]);
  }

  function openAddForDay(dateStr: string) {
    if (!canWrite) return;
    setEditEvent(null);
    setFTitle(""); setFDescription(""); setFStartDate(dateStr); setFEndDate("");
    setFAllDay(true); setFColor(PRESET_COLORS[0]); setFError("");
    setPrefillDate(dateStr);
    setShowForm(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditEvent(ev);
    setFTitle(ev.title);
    setFDescription(ev.description ?? "");
    setFStartDate(ev.startDate.slice(0, 10));
    setFEndDate(ev.endDate ? ev.endDate.slice(0, 10) : "");
    setFAllDay(ev.allDay);
    setFColor(ev.color ?? PRESET_COLORS[0]);
    setFError("");
    setSelectedEvent(null);
    setShowForm(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFError(""); setFSubmitting(true);
    try {
      const body = {
        title: fTitle.trim(),
        description: fDescription.trim() || undefined,
        startDate: fStartDate,
        endDate: fEndDate || undefined,
        allDay: fAllDay,
        color: fColor,
      };
      const url = editEvent ? `/api/calendar/${editEvent.id}` : "/api/calendar";
      const method = editEvent ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        await fetchEvents(currentMonth);
      } else {
        const data = await res.json();
        setFError(data.error ?? "Failed to save event.");
      }
    } finally {
      setFSubmitting(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedEvent(null);
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Calendar 📅</h1>
          <p className="text-slate-500 text-sm mt-0.5">Keep everyone in sync with upcoming events.</p>
        </div>
        {canWrite && (
          <button onClick={() => openAddForDay(format(today, "yyyy-MM-dd"))} className="btn-primary text-sm">
            + Add Event
          </button>
        )}
      </div>

      {/* Google Calendar Sync Card (OWNER / FAMILY only) */}
      {(role === "OWNER" || role === "FAMILY") && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-semibold text-slate-800 text-sm">Google Calendar Sync</span>
              {gcal && <span className="badge-green text-xs">Connected</span>}
            </div>
          </div>
          {!gcalLoading && (
            gcal ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600 flex-1">
                  Syncing <strong>{gcal.calendarName || "Google Calendar"}</strong> — your house manager can see these events.
                </p>
                <button onClick={disconnectGcal} className="text-xs text-red-500 hover:underline">Disconnect</button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Connect your Google Calendar so your house manager can see upcoming events.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={gcalInput}
                    onChange={e => { setGcalInput(e.target.value); setGcalError(""); }}
                    placeholder="Paste your Google Calendar iCal URL…"
                    className="input flex-1 text-sm"
                  />
                  <button onClick={connectGcal} disabled={gcalSaving || !gcalInput.trim()} className="btn-primary text-sm">
                    {gcalSaving ? "Connecting…" : "Connect"}
                  </button>
                </div>
                {gcalError && <p className="text-xs text-red-500 mt-1">{gcalError}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  ℹ️ In Google Calendar: Settings → [Your calendar] → "Secret address in iCal format"
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => goToMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-900">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          onClick={() => goToMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));
            const dayGcalEvents = gcalEvents.filter(ev =>
              format(new Date(ev.start), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            );
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isLastRow = i >= days.length - 7;
            return (
              <div
                key={dateStr}
                onClick={() => canWrite && openAddForDay(dateStr)}
                className={`min-h-[100px] p-2 border-b border-r border-slate-100 transition cursor-pointer hover:bg-slate-50
                  ${isLastRow ? "border-b-0" : ""}
                  ${(i + 1) % 7 === 0 ? "border-r-0" : ""}
                `}
              >
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? "bg-brand-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      className="text-white text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-90 transition"
                      style={{ backgroundColor: ev.color ?? "#1d4ed8" }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayGcalEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="text-xs rounded px-1.5 py-0.5 mb-0.5 truncate border border-blue-400 text-blue-700 bg-blue-50 flex items-center gap-1"
                      title={ev.title}
                    >
                      <span className="font-bold text-blue-400 text-[10px]">G</span>
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: selectedEvent.color ?? "#1d4ed8" }}
                />
                <h2 className="font-bold text-slate-900">{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                📅 {format(new Date(selectedEvent.startDate), "EEEE, MMMM d, yyyy")}
                {selectedEvent.endDate && ` – ${format(new Date(selectedEvent.endDate), "MMM d, yyyy")}`}
              </p>
              {selectedEvent.description && (
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              )}
              <p className="text-xs text-slate-400">Added by {selectedEvent.createdBy.name}</p>
            </div>
            {canWrite && (
              <div className="px-6 pb-4 flex gap-2 justify-end">
                <button
                  onClick={() => openEdit(selectedEvent)}
                  className="btn-secondary text-sm"
                >Edit</button>
                <button
                  onClick={() => deleteEvent(selectedEvent.id)}
                  className="text-sm px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 transition"
                >Delete</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editEvent ? "Edit Event" : "Add Event"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="input w-full" required placeholder="School play, doctor appointment…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={2} className="input w-full resize-none" placeholder="Optional details…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                  <input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFColor(c)}
                      className={`w-7 h-7 rounded-full transition ${fColor === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {fError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={fSubmitting} className="btn-primary text-sm">
                  {fSubmitting ? "Saving…" : editEvent ? "Save Changes" : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
