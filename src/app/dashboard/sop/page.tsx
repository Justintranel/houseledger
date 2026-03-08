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

// ─── Default room sections (seeded on first OWNER visit) ──────────────────────

const DEFAULT_SECTIONS = [
  "Kitchen",
  "Living Room",
  "Dining Room",
  "Family Room",
  "Primary Bedroom",
  "Primary Bathroom",
  "Guest Bedroom",
  "Guest Bathroom",
  "Powder Room",
  "Home Office",
  "Laundry Room",
  "Mudroom / Entry",
  "Garage",
  "Backyard & Outdoor",
];

// ─── Photo thumbnail ──────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  sopId,
  canEdit,
  onDelete,
  onCaptionSave,
}: {
  photo: SopPhoto;
  sopId: string;
  canEdit: boolean;
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
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
      <img
        src={photo.fileUrl}
        alt={photo.caption ?? photo.fileName}
        className="w-full h-36 object-cover"
      />
      {canEdit && (
        <button
          onClick={() => onDelete(photo.id)}
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
          title="Delete photo"
        >
          ✕
        </button>
      )}
      <div className="px-2 py-1.5">
        {editingCaption ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="text-xs border border-slate-300 rounded px-1.5 py-0.5 flex-1 min-w-0"
              placeholder="Caption…"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCaption();
                if (e.key === "Escape") setEditingCaption(false);
              }}
            />
            <button onClick={saveCaption} disabled={saving} className="text-xs text-brand-600 font-medium">{saving ? "…" : "Save"}</button>
          </div>
        ) : (
          <p
            className={`text-xs leading-snug ${photo.caption ? "text-slate-500" : "text-slate-400 italic"} ${canEdit ? "cursor-pointer hover:text-brand-600" : ""}`}
            onClick={canEdit ? () => setEditingCaption(true) : undefined}
          >
            {photo.caption ?? (canEdit ? "Add caption…" : "")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SopSection({
  sop,
  canEdit,
  onChange,
  onDelete,
}: {
  sop: Sop;
  canEdit: boolean;
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

  async function saveName() {
    if (!nameDraft.trim() || nameDraft === sop.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await fetch(`/api/sop/${sop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChange(updated);
        setEditingName(false);
      }
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
      if (res.ok) {
        const photo = await res.json();
        onChange({ ...sop, photos: [...sop.photos, photo] });
      }
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
    <div className="card overflow-hidden p-0">
      {/* Section header */}
      <div className="flex items-center gap-2 px-5 py-4 cursor-pointer hover:bg-slate-50 transition" onClick={() => setIsOpen((o) => !o)}>
        <span className="text-lg">🏠</span>
        {editingName && canEdit ? (
          <input
            autoFocus
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); saveName(); }
              if (e.key === "Escape") setEditingName(false);
            }}
            onBlur={saveName}
          />
        ) : (
          <span className="flex-1 font-semibold text-slate-800">{sop.name}</span>
        )}

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {sop.photos.length > 0 ? (
            <span className="text-xs text-slate-400">{sop.photos.length} photo{sop.photos.length !== 1 ? "s" : ""}</span>
          ) : canEdit && (
            <span className="text-xs text-slate-300 flex items-center gap-1" title="No photos yet — expand to upload">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add photos
            </span>
          )}
          {canEdit && !editingName && (
            <button
              onClick={() => { setEditingName(true); setIsOpen(true); }}
              className="text-slate-400 hover:text-brand-600 transition"
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
              className="text-slate-300 hover:text-red-500 transition"
              title="Delete section"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-1 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes & Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
              rows={5}
              disabled={!canEdit}
              placeholder={canEdit ? "Describe how this area should be maintained, specific instructions, important details…" : "No notes added yet."}
              className="input w-full resize-y text-sm disabled:bg-white disabled:text-slate-700 disabled:cursor-default"
            />
            {canEdit && notesDirty && (
              <div className="flex items-center gap-2 mt-2">
                <button onClick={saveNotes} disabled={savingNotes} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
                <button onClick={() => { setNotes(sop.notes ?? ""); setNotesDirty(false); }} className="btn-secondary text-xs py-1.5 px-3">Discard</button>
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Reference Photos
                {sop.photos.length > 0 && (
                  <span className="ml-2 text-slate-400 font-normal normal-case">({sop.photos.length})</span>
                )}
              </label>
              {canEdit && sop.photos.length > 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {uploadingPhoto ? "Uploading…" : "Upload Photo"}
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
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  draggingOver
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
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
                <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadingPhoto ? (
                  <p className="text-sm text-brand-600 font-medium">Uploading…</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">Click or drag to upload a photo</p>
                    <p className="text-xs text-slate-400 mt-1">Add reference images showing how this area should look</p>
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

  const load = useCallback(async () => {
    const res = await fetch("/api/sop");
    if (res.ok) setSops(await res.json());
    setLoading(false);
  }, []);

  // Auto-seed default rooms for OWNER on first visit (no sections exist yet)
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
      if (failed > 0)
        setSeedError(`${failed} room(s) could not be created. Please refresh the page and try again.`);
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
        // First visit — auto-create default rooms silently
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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">House SOPs</h1>
        <p className="text-slate-500 text-sm mt-1">
          {canEdit
            ? "Document how each area of your home should be maintained — notes, instructions, and reference photos."
            : "Detailed instructions and reference photos for each area of the home."}
        </p>
      </div>

      {seedError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {seedError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-3xl mb-3">⌛</div>
          <p className="text-sm">Setting up your rooms…</p>
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-slate-600">No rooms added yet.</p>
          {!canEdit && <p className="text-sm mt-1">Ask the owner to set up the house rooms.</p>}
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
