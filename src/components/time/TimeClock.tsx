"use client";
import { useState, useEffect, useRef } from "react";

interface RunningEntry {
  id: string;
  startAt: string | null;
}

interface Props {
  initialRunning: RunningEntry | null;
  userName: string;
}

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimeClock({ initialRunning, userName }: Props) {
  const [running, setRunning] = useState<RunningEntry | null>(initialRunning);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start or restart the elapsed timer whenever the running entry changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (running?.startAt) {
      const startMs = new Date(running.startAt).getTime();
      const tick = () => setElapsed(Date.now() - startMs);
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const handleClock = async (action: "in" | "out") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/time/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (action === "in") {
        setRunning(data as RunningEntry);
      } else {
        setRunning(null);
        setNotes("");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const isClockedIn = !!running;

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-sm mx-auto">
      {/* Status indicator */}
      <div
        className={`w-4 h-4 rounded-full mb-6 ${isClockedIn ? "bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse" : "bg-slate-300"}`}
      />

      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {isClockedIn ? "Currently Clocked In" : "Currently Clocked Out"}
      </p>

      {/* Timer */}
      <div
        className={`text-6xl font-mono font-bold mb-8 tabular-nums ${isClockedIn ? "text-slate-900" : "text-slate-300"}`}
      >
        {isClockedIn ? formatElapsed(elapsed) : "00:00:00"}
      </div>

      {/* Notes */}
      {!isClockedIn && (
        <div className="w-full mb-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            className="input w-full text-sm resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What are you working on today?"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
      )}

      {/* Clock In / Out button */}
      <button
        onClick={() => handleClock(isClockedIn ? "out" : "in")}
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-lg font-bold transition disabled:opacity-50 ${
          isClockedIn
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
        }`}
      >
        {loading ? "…" : isClockedIn ? "Clock Out" : "Clock In"}
      </button>

      {isClockedIn && running?.startAt && (
        <p className="text-xs text-slate-400 mt-4">
          Started at{" "}
          {new Date(running.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      <p className="text-xs text-slate-400 mt-2">{userName}</p>
    </div>
  );
}
