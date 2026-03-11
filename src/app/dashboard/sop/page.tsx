"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SopPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
  caption: string | null;
  sortOrder: number;
}

interface Sop {
  id: string;
  name: string;
  notes: string | null;
  sortOrder: number;
  photos: SopPhoto[];
}

// ─── Room icon + accent color map ─────────────────────────────────────────────

const ROOM_STYLES: Record<string, { icon: string; accent: string; bg: string; border: string }> = {
  "Kitchen":           { icon: "🍳", accent: "bg-orange-500", bg: "bg-orange-50",  border: "border-orange-200" },
  "Living Room":       { icon: "🛋️", accent: "bg-blue-500",   bg: "bg-blue-50",    border: "border-blue-200"   },
  "Dining Room":       { icon: "🍽️", accent: "bg-purple-500", bg: "bg-purple-50",  border: "border-purple-200" },
  "Family Room":       { icon: "👨‍👩‍👧", accent: "bg-green-500", bg: "bg-green-50",   border: "border-green-200"  },
  "Primary Bedroom":   { icon: "🛏️", accent: "bg-indigo-500", bg: "bg-indigo-50",  border: "border-indigo-200" },
  "Primary Bathroom":  { icon: "🛁", accent: "bg-cyan-500",   bg: "bg-cyan-50",    border: "border-cyan-200"   },
  "Guest Bedroom":     { icon: "🛏️", accent: "bg-slate-400",  bg: "bg-slate-50",   border: "border-slate-200"  },
  "Guest Bathroom":    { icon: "🚿", accent: "bg-teal-500",   bg: "bg-teal-50",    border: "border-teal-200"   },
  "Powder Room":       { icon: "🪞",  accent: "bg-pink-500",   bg: "bg-pink-50",    border: "border-pink-200"   },
  "Home Office":       { icon: "💼",  accent: "bg-amber-500",  bg: "bg-amber-50",   border: "border-amber-200"  },
  "Laundry Room":      { icon: "🧺",  accent: "bg-sky-500",    bg: "bg-sky-50",     border: "border-sky-200"    },
  "Mudroom / Entry":   { icon: "🚪",  accent: "bg-stone-500",  bg: "bg-stone-50",   border: "border-stone-200"  },
  "Garage":            { icon: "🚗",  accent: "bg-zinc-500",   bg: "bg-zinc-50",    border: "border-zinc-200"   },
  "Backyard & Outdoor":{ icon: "🌿",  accent: "bg-lime-600",   bg: "bg-lime-50",    border: "border-lime-200"   },
};

const DEFAULT_STYLE = { icon: "📋", accent: "bg-brand-600", bg: "bg-brand-50", border: "border-brand-200" };

function getRoomStyle(name: string) {
  return ROOM_STYLES[name] ?? DEFAULT_STYLE;
}

// ─── Default room sections ────────────────────────────────────────────────────

const DEFAULT_SECTIONS = [
  "Kitchen","Living Room","Dining Room","Family Room","Primary Bedroom",
  "Primary Bathroom","Guest Bedroom","Guest Bathroom","Powder Room",
  "Home Office","Laundry Room","Mudroom / Entry","Garage","Backyard & Outdoor",
];

// ─── Photo thumbnail ──────────────────────────────────────────────────────────

function PhotoCard({
  photo, sopId, canEdit, onDelete, onCaptionSave,
}: {
  photo: SopPhoto; sopId: string; canEdit: boolean;
  onDelete: (photoId: string) => void;
  onCaptionSave: (photoId: string, caption: string) => void;
}) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [draft, setDraft] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);

  async function saveCaption() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sop/${sopId}/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: draft }),
      });
      if (res.ok) { onCaptionSave(photo.id, draft); setEditingCaption(false); }
    } finally { setSaving(false); }
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <img
          src={photo.fileUrl}
          alt={photo.caption ?? photo.fileName}
          className="w-full h-40 object-cover"
        />
        {canEdit && (
          <button
            onClick={() => onDelete(photo.id)}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
            title="Delete photo"
          >
            ✕
          </button>
        )}
      </div>
      <div className="px-3 py-2">
        {editingCaption ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 flex-1 min-w-0"
              placeholder="Caption…"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCaption();
                if (e.key === "Escape") setEditingCaption(false);
              }}
            />
            <button onClick={saveCaption} disabled={saving} className="text-xs text-brand-600 font-semibold whitespace-nowrap">
              {saving ? "…" : "Save"}
            </button>
          </div>
        ) : (
          <p
            className={`text-xs leading-snug ${photo.caption ? "text-slate-600" : "text-slate-400 italic"} ${canEdit ? "cursor-pointer hover:text-brand-600" : ""}`}
            onClick={canEdit ? () => setEditingCaption(true) : undefined}
          >
            {photo.caption ?? (canEdit ? "Click to add caption…" : "")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SopSection({
  sop, canEdit, onChange, onDelete,
}: {
  sop: Sop; canEdit: boolean;
  onChange: (updated: Sop) => void;
  onDelete: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(sop.name);
  const [notes, setNotes] = useState(sop.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = getRoomStyle(sop.name);
  const hasContent = !!sop.notes || sop.photos.length > 0;

  async function saveName() {
    if (!nameDraft.trim() || nameDraft === sop.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await fetch(`/api/sop/${sop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      if (res.ok) { onChange(await res.json()); setEditingName(false); }
    } finally { setSavingName(false); }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/sop/${sop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (res.ok) { onChange({ ...sop, notes: notes || null }); setNotesDirty(false); }
    } finally { setSavingNotes(false); }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/sop/${sop.id}/photos`, { method: "POST", body: fd });
      if (res.ok) onChange({ ...sop, photos: [...sop.photos, await res.json()] });
    } finally { setUploadingPhoto(false); }
  }

  async function deletePhoto(photoId: string) {
    const res = await fetch(`/api/sop/${sop.id}/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) onChange({ ...sop, photos: sop.photos.filter((p) => p.id !== photoId) });
  }

  function onCaptionSave(photoId: string, caption: string) {
    onChange({ ...sop, photos: sop.photos.map((p) => (p.id === photoId ? { ...p, caption } : p)) });
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${style.border} shadow-sm bg-white transition-all`}>
      {/* Colored top accent bar */}
      <div className={`h-1 w-full ${style.accent}`} />

      {/* Section header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition"
        onClick={() => setIsOpen((o) => !o)}
      >
        {/* Room icon bubble */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${style.bg} border ${style.border}`}>
          {style.icon}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingName && canEdit ? (
            <input
              autoFocus
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); saveName(); }
                if (e.key === "Escape") setEditingName(false);
              }}
              onBlur={saveName}
            />
          ) : (
            <div>
              <span className="font-bold text-slate-800 text-[15px]">{sop.name}</span>
              {/* Preview badges in collapsed state */}
              {!isOpen && (
                <div className="flex items-center gap-2 mt-0.5">
                  {sop.notes && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Notes
                    </span>
                  )}
                  {sop.photos.length > 0 && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {sop.photos.length} photo{sop.photos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {!hasContent && canEdit && (
                    <span className="text-xs text-slate-300 italic">No content yet — click to add</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Tiny photo strip preview */}
          {!isOpen && sop.photos.length > 0 && (
            <div className="hidden sm:flex -space-x-2">
              {sop.photos.slice(0, 3).map((p) => (
                <img
                  key={p.id}
                  src={p.fileUrl}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm"
                />
              ))}
              {sop.photos.length > 3 && (
                <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-semibold shadow-sm">
                  +{sop.photos.length - 3}
                </div>
              )}
            </div>
          )}

          {canEdit && !editingName && (
            <button
              onClick={() => { setEditingName(true); setIsOpen(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
              title="Rename section"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => { if (confirm(`Delete "${sop.name}"?`)) onDelete(sop.id); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
              title="Delete section"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg className={`w-4 h-4 text-slate-400 transition-transform ml-1 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-6">
          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes & Instructions</span>
              {sop.notes && !notesDirty && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Saved</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
              rows={5}
              disabled={!canEdit}
              placeholder={canEdit
                ? "Describe how this area should be maintained — cleaning standards, special care instructions, important notes for your house manager…"
                : "No notes added yet."}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-white disabled:text-slate-700 disabled:cursor-default shadow-sm placeholder:text-slate-400"
            />
            {canEdit && notesDirty && (
              <div className="flex items-center gap-2 mt-2">
                <button onClick={saveNotes} disabled={savingNotes} className="btn-primary text-xs py-1.5 px-4">
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
                <button
                  onClick={() => { setNotes(sop.notes ?? ""); setNotesDirty(false); }}
                  className="btn-secondary text-xs py-1.5 px-4"
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Photos</span>
                {sop.photos.length > 0 && (
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {sop.photos.length}
                  </span>
                )}
              </div>
              {canEdit && sop.photos.length > 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {uploadingPhoto ? "Uploading…" : "Add Photo"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
              />
            </div>

            {sop.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sop.photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    sopId={sop.id}
                    canEdit={canEdit}
                    onDelete={deletePhoto}
                    onCaptionSave={onCaptionSave}
                  />
                ))}
              </div>
            ) : canEdit ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  draggingOver
                    ? `${style.border} ${style.bg}`
                    : "border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
                onDragLeave={() => setDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggingOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("image/")) uploadPhoto(f);
                }}
              >
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${style.bg} border ${style.border}`}>
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {uploadingPhoto ? (
                  <p className="text-sm text-brand-600 font-semibold">Uploading…</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Click or drag to upload a photo</p>
                    <p className="text-xs text-slate-400 mt-1">Add reference images showing how this room should look when maintained correctly</p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No photos added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SopPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canEdit = role === "OWNER";

  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/sop");
    if (res.ok) setSops(await res.json());
    setLoading(false);
  }, []);

  const seedDefaults = useCallback(async () => {
    setSeedError(null);
    try {
      let failed = 0;
      for (const name of DEFAULT_SECTIONS) {
        const res = await fetch("/api/sop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) failed++;
      }
      await load();
      if (failed > 0) setSeedError(`${failed} room(s) could not be created. Please refresh and try again.`);
    } catch {
      setSeedError("Network error while setting up rooms. Please refresh and try again.");
    }
  }, [load]);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/sop");
      if (!res.ok) { setLoading(false); return; }
      const data: Sop[] = await res.json();
      if (data.length === 0 && role === "OWNER") {
        await seedDefaults();
      } else {
        setSops(data);
        setLoading(false);
      }
    }
    if (role !== undefined) init();
  }, [role, seedDefaults]);

  function updateSop(updated: Sop) {
    setSops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function deleteSop(id: string) {
    const res = await fetch(`/api/sop/${id}`, { method: "DELETE" });
    if (res.ok) setSops((prev) => prev.filter((s) => s.id !== id));
  }

  async function addSection() {
    if (!newSectionName.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectionName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setSops((prev) => [...prev, created]);
        setNewSectionName("");
        setAddingSection(false);
      }
    } finally { setSavingNew(false); }
  }

  // Stats
  const withNotes  = sops.filter((s) => s.notes).length;
  const totalPhotos = sops.reduce((sum, s) => sum + s.photos.length, 0);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">House SOPs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {canEdit
              ? "Document how each area of your home should be maintained — notes, instructions, and reference photos."
              : "Detailed instructions and reference photos for each area of the home."}
          </p>
        </div>
        {canEdit && !loading && (
          <button
            onClick={() => setAddingSection(true)}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room / Area
          </button>
        )}
      </div>

      {/* Stats bar */}
      {!loading && sops.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Rooms", value: sops.length, icon: "🏠" },
            { label: "With Notes", value: withNotes, icon: "📝" },
            { label: "Photos", value: totalPhotos, icon: "📸" },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add section inline form */}
      {addingSection && canEdit && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <input
            autoFocus
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            className="input flex-1 text-sm"
            placeholder="Room or area name (e.g. Basement, Wine Cellar, Gym…)"
            onKeyDown={(e) => {
              if (e.key === "Enter") addSection();
              if (e.key === "Escape") { setAddingSection(false); setNewSectionName(""); }
            }}
          />
          <button onClick={addSection} disabled={savingNew || !newSectionName.trim()} className="btn-primary text-sm px-4 py-2">
            {savingNew ? "Adding…" : "Add"}
          </button>
          <button onClick={() => { setAddingSection(false); setNewSectionName(""); }} className="btn-secondary text-sm px-3 py-2">
            Cancel
          </button>
        </div>
      )}

      {seedError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{seedError}</div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Setting up your rooms…</p>
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">📋</div>
          <p className="font-bold text-slate-700 text-lg mb-1">No rooms added yet</p>
          {!canEdit && <p className="text-sm text-slate-400">Ask the owner to set up the house rooms.</p>}
          {canEdit && (
            <button onClick={() => setAddingSection(true)} className="btn-primary text-sm mt-4 px-6 py-2.5">
              Add Your First Room
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sops.map((sop) => (
            <SopSection
              key={sop.id}
              sop={sop}
              canEdit={canEdit}
              onChange={updateSop}
              onDelete={deleteSop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
