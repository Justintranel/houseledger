"use client";
import { useState } from "react";

interface Props {
  taskId: string;
  currentType: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const TYPE_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly (specific days)" },
  { value: "MONTHLY", label: "Monthly (day of month)" },
  { value: "SEASONAL", label: "Seasonal (specific months)" },
  { value: "CUSTOM", label: "Custom (every N days)" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RecurrenceEditor({ taskId, currentType, onSaved, onCancel }: Props) {
  const [scope, setScope] = useState<"this_future" | "all">("this_future");
  const [type, setType] = useState(currentType ?? "WEEKLY");
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthday, setMonthday] = useState(1);
  const [months, setMonths] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleWeekday = (d: number) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const toggleMonth = (m: number) =>
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          type,
          interval,
          weekdays: type === "WEEKLY" ? weekdays : [],
          monthday: type === "MONTHLY" ? monthday : null,
          months: type === "SEASONAL" ? months : [],
          endDate: endDate || null,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to update recurrence");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
      {/* Scope */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">Apply changes to</label>
        <div className="space-y-1.5">
          {[
            { value: "this_future", label: "This and future occurrences" },
            { value: "all", label: "Entire series" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={`scope-${taskId}`}
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value as "this_future" | "all")}
                className="accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Repeat</label>
        <select
          className="input w-full text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly — pick days */}
      {type === "WEEKLY" && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">On days</label>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  weekdays.includes(i)
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-brand-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly — day of month */}
      {type === "MONTHLY" && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">
            Day of month
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={monthday}
            onChange={(e) => setMonthday(parseInt(e.target.value))}
            className="input w-24 text-sm"
          />
        </div>
      )}

      {/* Seasonal — months */}
      {type === "SEASONAL" && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">In months</label>
          <div className="flex flex-wrap gap-1">
            {MONTH_LABELS.map((label, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => toggleMonth(i + 1)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  months.includes(i + 1)
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-brand-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom — every N days */}
      {type === "CUSTOM" && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Every</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
              className="input w-20 text-sm"
            />
            <span className="text-sm text-slate-600">days</span>
          </div>
        </div>
      )}

      {/* End date */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">
          End date (optional)
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save recurrence"}
        </button>
        <button onClick={onCancel} className="btn-secondary px-4 text-sm py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
