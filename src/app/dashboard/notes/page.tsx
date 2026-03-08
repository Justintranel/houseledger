"use client";

import { useState, useEffect, useCallback } from "react";

type Visibility = "SHARED" | "PRIVATE";

interface Note {
  id: string;
  body: string;
  visibility: Visibility;
  date: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NotesPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalDateString(new Date())
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<Visibility>("SHARED");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/notes?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          body: noteBody,
          visibility: noteVisibility,
        }),
      });
      if (res.ok) {
        setNoteBody("");
        fetchNotes();
      }
    } finally {
      setNoteSubmitting(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Log daily observations, reminders, and updates for the household.
        </p>
      </div>

      <div className="space-y-6">
        {/* Date picker */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-auto"
          />
        </div>

        {/* Add note form */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Add a Note
          </h2>
          <form onSubmit={submitNote} className="space-y-3">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write your note here..."
              rows={3}
              className="input w-full resize-none"
              required
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Visibility:</label>
                <select
                  value={noteVisibility}
                  onChange={(e) =>
                    setNoteVisibility(e.target.value as Visibility)
                  }
                  className="input py-1 text-sm"
                >
                  <option value="SHARED">Shared</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={noteSubmitting}
                className="btn-primary text-sm"
              >
                {noteSubmitting ? "Saving..." : "Add Note"}
              </button>
            </div>
          </form>
        </div>

        {/* Notes list */}
        {notesLoading ? (
          <p className="text-sm text-slate-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No notes for this date.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-slate-800 whitespace-pre-wrap">
                      {note.body}
                    </p>
                  </div>
                  <span
                    className={
                      note.visibility === "SHARED"
                        ? "badge badge-blue flex-shrink-0"
                        : "badge badge-slate flex-shrink-0"
                    }
                  >
                    {note.visibility}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">
                    {note.author?.name ?? "Unknown"}
                  </span>
                  <span>·</span>
                  <span>{formatTime(note.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
