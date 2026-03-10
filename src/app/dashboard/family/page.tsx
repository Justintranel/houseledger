"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface FamilyMember {
  id: string;
  type: "PERSON" | "PET";
  petType: string | null;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  birthdate: string | null;
  allergies: string | null;
  medications: string | null;
  dislikes: string | null;
  thingsToKnow: string | null;
  sortOrder: number;
}

interface HouseRule {
  id: string;
  rule: string;
  sortOrder: number;
}

const PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Horse", "Reptile", "Other"];

const EMPTY_FORM = {
  type: "PERSON" as "PERSON" | "PET",
  name: "",
  petType: "",
  bio: "",
  birthdate: "",
  allergies: "",
  medications: "",
  dislikes: "",
  thingsToKnow: "",
};

export default function FamilyBioPage() {
  const [tab, setTab] = useState<"people" | "rules">("people");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Photo upload
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMemberId, setPhotoMemberId] = useState<string | null>(null);

  // House Rules
  const [newRule, setNewRule] = useState("");
  const [addingRule, setAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleText, setEditingRuleText] = useState("");
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  // Delete member
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([fetch("/api/family"), fetch("/api/house-rules")]);
      if (mRes.ok) setMembers(await mRes.json());
      if (rRes.ok) setRules(await rRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd(type: "PERSON" | "PET") {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(m: FamilyMember) {
    setEditingId(m.id);
    setForm({
      type: m.type,
      name: m.name,
      petType: m.petType ?? "",
      bio: m.bio ?? "",
      birthdate: m.birthdate ?? "",
      allergies: m.allergies ?? "",
      medications: m.medications ?? "",
      dislikes: m.dislikes ?? "",
      thingsToKnow: m.thingsToKnow ?? "",
    });
    setModalError("");
    setModalOpen(true);
  }

  async function saveMember() {
    if (!form.name.trim()) { setModalError("Name is required."); return; }
    setSaving(true);
    setModalError("");
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        petType: form.type === "PET" ? (form.petType || null) : null,
        bio: form.bio.trim() || null,
        birthdate: form.birthdate.trim() || null,
        allergies: form.allergies.trim() || null,
        medications: form.medications.trim() || null,
        dislikes: form.dislikes.trim() || null,
        thingsToKnow: form.thingsToKnow.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/family/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setModalOpen(false);
        await load();
      } else {
        const d = await res.json();
        setModalError(d.error ?? "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this person/pet from the Family Bio?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/family/${id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadPhoto(memberId: string, file: File) {
    setUploadingPhotoFor(memberId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/family/${memberId}/photo`, { method: "POST", body: fd });
      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) => prev.map((m) => m.id === memberId ? updated : m));
      }
    } finally {
      setUploadingPhotoFor(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && photoMemberId) {
      uploadPhoto(photoMemberId, file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addRule() {
    if (!newRule.trim()) return;
    setAddingRule(true);
    try {
      const res = await fetch("/api/house-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: newRule.trim() }),
      });
      if (res.ok) {
        const r = await res.json();
        setRules((prev) => [...prev, r]);
        setNewRule("");
      }
    } finally {
      setAddingRule(false);
    }
  }

  async function saveRule(id: string) {
    if (!editingRuleText.trim()) return;
    try {
      const res = await fetch(`/api/house-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: editingRuleText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRules((prev) => prev.map((r) => r.id === id ? updated : r));
        setEditingRuleId(null);
      }
    } catch {}
  }

  async function deleteRule(id: string) {
    if (!confirm("Remove this house rule?")) return;
    setDeletingRuleId(id);
    try {
      await fetch(`/api/house-rules/${id}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingRuleId(null);
    }
  }

  const people = members.filter((m) => m.type === "PERSON");
  const pets = members.filter((m) => m.type === "PET");

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Bio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Document your family members, pets, and house rules for your house manager.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd("PERSON")} className="btn-secondary text-sm px-3 py-2">
            + Add Person
          </button>
          <button onClick={() => openAdd("PET")} className="btn-primary text-sm px-3 py-2">
            🐾 Add Pet
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {([["people", "👨‍👩‍👧‍👦", "People & Pets"], ["rules", "📋", "House Rules"]] as const).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === key ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* PEOPLE & PETS TAB */}
      {tab === "people" && (
        <div className="space-y-8">
          {loading ? (
            <p className="text-slate-400 text-sm py-8 text-center">Loading…</p>
          ) : members.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-3xl mb-3">👨‍👩‍👧‍👦</p>
              <p className="text-slate-600 font-medium mb-1">No family members yet</p>
              <p className="text-slate-400 text-sm mb-4">Add family members and pets so your house manager knows who's in the household.</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => openAdd("PERSON")} className="btn-secondary text-sm px-4 py-2">+ Add Person</button>
                <button onClick={() => openAdd("PET")} className="btn-primary text-sm px-4 py-2">🐾 Add Pet</button>
              </div>
            </div>
          ) : (
            <>
              {/* People */}
              {people.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">People</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {people.map((m) => (
                      <MemberCard
                        key={m.id}
                        member={m}
                        onEdit={() => openEdit(m)}
                        onDelete={() => deleteMember(m.id)}
                        onPhotoClick={() => {
                          setPhotoMemberId(m.id);
                          fileInputRef.current?.click();
                        }}
                        uploadingPhoto={uploadingPhotoFor === m.id}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pets */}
              {pets.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pets.map((m) => (
                      <MemberCard
                        key={m.id}
                        member={m}
                        onEdit={() => openEdit(m)}
                        onDelete={() => deleteMember(m.id)}
                        onPhotoClick={() => {
                          setPhotoMemberId(m.id);
                          fileInputRef.current?.click();
                        }}
                        uploadingPhoto={uploadingPhotoFor === m.id}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HOUSE RULES TAB */}
      {tab === "rules" && (
        <div className="max-w-2xl space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-amber-50">
              <h2 className="text-sm font-semibold text-amber-800">📋 House Rules</h2>
              <p className="text-xs text-amber-700 mt-0.5">Rules your house manager should know and follow while working in your home.</p>
            </div>

            {loading ? (
              <p className="px-5 py-4 text-sm text-slate-400">Loading…</p>
            ) : rules.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No house rules added yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {rules.map((r, idx) => (
                  <div key={r.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="text-slate-400 font-semibold text-sm mt-0.5 min-w-[1.5rem]">{idx + 1}.</span>
                    {editingRuleId === r.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingRuleText}
                          onChange={(e) => setEditingRuleText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveRule(r.id); if (e.key === "Escape") setEditingRuleId(null); }}
                          className="input text-sm flex-1"
                          autoFocus
                        />
                        <button onClick={() => saveRule(r.id)} className="btn-primary text-xs px-3 py-1.5">Save</button>
                        <button onClick={() => setEditingRuleId(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-slate-700">{r.rule}</p>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => { setEditingRuleId(r.id); setEditingRuleText(r.rule); }}
                            className="text-xs text-slate-400 hover:text-brand-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRule(r.id)}
                            disabled={deletingRuleId === r.id}
                            className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50"
                          >
                            {deletingRuleId === r.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add rule form */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addRule(); }}
                  placeholder="Add a house rule… (e.g. No shoes inside the house)"
                  className="input text-sm flex-1"
                />
                <button
                  onClick={addRule}
                  disabled={addingRule || !newRule.trim()}
                  className="btn-primary text-sm px-4 disabled:opacity-50"
                >
                  {addingRule ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit" : "Add"} {form.type === "PERSON" ? "Family Member" : "Pet"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type toggle (only for new) */}
              {!editingId && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(["PERSON", "PET"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${form.type === t ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                    >
                      {t === "PERSON" ? "👤 Person" : "🐾 Pet"}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {form.type === "PERSON" ? "Full Name" : "Pet Name"} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input w-full"
                  placeholder={form.type === "PERSON" ? "e.g. Sarah Smith" : "e.g. Max"}
                />
              </div>

              {form.type === "PET" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pet Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PET_TYPES.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, petType: f.petType === pt ? "" : pt }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition border ${form.petType === pt ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200 text-slate-600 hover:border-brand-400"}`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === "PERSON" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Birthday (optional)</label>
                  <input
                    type="text"
                    value={form.birthdate}
                    onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
                    className="input w-full"
                    placeholder="e.g. March 15 or 2010-03-15"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bio / About</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="input w-full resize-none"
                  placeholder={form.type === "PERSON" ? "Brief introduction, interests, personality…" : "Breed, personality, quirks…"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Allergies</label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                  rows={2}
                  className="input w-full resize-none"
                  placeholder="List any allergies or sensitivities…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Medications</label>
                <textarea
                  value={form.medications}
                  onChange={(e) => setForm((f) => ({ ...f, medications: e.target.value }))}
                  rows={2}
                  className="input w-full resize-none"
                  placeholder="Current medications, dosage, schedule…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dislikes</label>
                <textarea
                  value={form.dislikes}
                  onChange={(e) => setForm((f) => ({ ...f, dislikes: e.target.value }))}
                  rows={2}
                  className="input w-full resize-none"
                  placeholder="Things they don't like or that should be avoided…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Things to Know</label>
                <textarea
                  value={form.thingsToKnow}
                  onChange={(e) => setForm((f) => ({ ...f, thingsToKnow: e.target.value }))}
                  rows={3}
                  className="input w-full resize-none"
                  placeholder="Important notes, preferences, or anything your house manager should know…"
                />
              </div>

              {modalError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm px-4">Cancel</button>
              <button onClick={saveMember} disabled={saving} className="btn-primary text-sm px-5">
                {saving ? "Saving…" : editingId ? "Save Changes" : `Add ${form.type === "PERSON" ? "Person" : "Pet"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Member Card Component ──────────────────────────────────────────────────────

function MemberCard({
  member,
  onEdit,
  onDelete,
  onPhotoClick,
  uploadingPhoto,
  deleting,
}: {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
  onPhotoClick: () => void;
  uploadingPhoto: boolean;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const details = [
    { label: "Birthday", value: member.birthdate, show: member.type === "PERSON" },
    { label: "Allergies", value: member.allergies, show: true },
    { label: "Medications", value: member.medications, show: true },
    { label: "Dislikes", value: member.dislikes, show: true },
    { label: "Things to Know", value: member.thingsToKnow, show: true },
  ].filter((d) => d.show && d.value);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex gap-4">
        {/* Photo */}
        <div className="shrink-0">
          <button
            onClick={onPhotoClick}
            disabled={uploadingPhoto}
            className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 block hover:opacity-80 transition group"
            title="Click to upload photo"
          >
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {member.type === "PET" ? "🐾" : "👤"}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-medium">📷</span>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight">{member.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {member.type === "PET" && member.petType && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                    {member.petType}
                  </span>
                )}
                {member.type === "PERSON" && member.birthdate && (
                  <span className="text-xs text-slate-400">🎂 {member.birthdate}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={onEdit} className="text-xs text-slate-400 hover:text-brand-600 transition px-1">Edit</button>
              <button onClick={onDelete} disabled={deleting} className="text-xs text-red-400 hover:text-red-600 transition px-1 disabled:opacity-50">
                {deleting ? "…" : "Remove"}
              </button>
            </div>
          </div>

          {member.bio && (
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{member.bio}</p>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {details.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
          >
            <span>{expanded ? "Hide" : "Show"} details ({details.length})</span>
            <span>{expanded ? "▲" : "▼"}</span>
          </button>

          {expanded && (
            <div className="px-4 py-3 space-y-3 bg-slate-50 border-t border-slate-100">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{d.label}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.value}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
