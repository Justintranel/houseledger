"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface FamilyMember {
  id: string;
  type: "PERSON" | "PET";
  petType: string | null;
  name: string;
  photoUrl: string | null;
  sortOrder: number;
  // Shared
  bio: string | null;
  birthdate: string | null;
  height: string | null;
  weight: string | null;
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  dietaryRestrictions: string | null;
  dislikes: string | null;
  thingsToKnow: string | null;
  favoriteFood: string | null;
  // Person: school
  school: string | null;
  grade: string | null;
  teacher: string | null;
  activities: string | null;
  // Person: medical
  doctor: string | null;
  dentist: string | null;
  // Person: travel
  passportNumber: string | null;
  passportExpiry: string | null;
  passportCountry: string | null;
  tsaPrecheck: string | null;
  globalEntry: string | null;
  nexus: string | null;
  frequentFlyer: string | null;
  seatPreference: string | null;
  mealPreference: string | null;
  // Pet
  breed: string | null;
  vet: string | null;
  microchip: string | null;
  feedingSchedule: string | null;
  walkSchedule: string | null;
  vaccinations: string | null;
}

interface HouseRule {
  id: string;
  rule: string;
  sortOrder: number;
}

const PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Horse", "Reptile", "Other"];

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];

const EMPTY_FORM = {
  type: "PERSON" as "PERSON" | "PET",
  name: "",
  petType: "",
  // Shared
  bio: "",
  birthdate: "",
  height: "",
  weight: "",
  bloodType: "",
  allergies: "",
  medications: "",
  dietaryRestrictions: "",
  dislikes: "",
  thingsToKnow: "",
  favoriteFood: "",
  // Person: school
  school: "",
  grade: "",
  teacher: "",
  activities: "",
  // Person: medical
  doctor: "",
  dentist: "",
  // Person: travel
  passportNumber: "",
  passportExpiry: "",
  passportCountry: "",
  tsaPrecheck: "",
  globalEntry: "",
  nexus: "",
  frequentFlyer: "",
  seatPreference: "",
  mealPreference: "",
  // Pet
  breed: "",
  vet: "",
  microchip: "",
  feedingSchedule: "",
  walkSchedule: "",
  vaccinations: "",
};

type FormState = typeof EMPTY_FORM;

function nullify(val: string): string | null {
  return val.trim() || null;
}

export default function FamilyBioPage() {
  const [tab, setTab] = useState<"people" | "rules">("people");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Photo inside modal
  const [modalPhotoFile, setModalPhotoFile] = useState<File | null>(null);
  const [modalPhotoPreview, setModalPhotoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);

  // Card-level photo upload (click photo on card)
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [cardPhotoMemberId, setCardPhotoMemberId] = useState<string | null>(null);

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
    setModalPhotoFile(null);
    setModalPhotoPreview(null);
    setCurrentPhotoUrl(null);
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
      height: m.height ?? "",
      weight: m.weight ?? "",
      bloodType: m.bloodType ?? "",
      allergies: m.allergies ?? "",
      medications: m.medications ?? "",
      dietaryRestrictions: m.dietaryRestrictions ?? "",
      dislikes: m.dislikes ?? "",
      thingsToKnow: m.thingsToKnow ?? "",
      favoriteFood: m.favoriteFood ?? "",
      school: m.school ?? "",
      grade: m.grade ?? "",
      teacher: m.teacher ?? "",
      activities: m.activities ?? "",
      doctor: m.doctor ?? "",
      dentist: m.dentist ?? "",
      passportNumber: m.passportNumber ?? "",
      passportExpiry: m.passportExpiry ?? "",
      passportCountry: m.passportCountry ?? "",
      tsaPrecheck: m.tsaPrecheck ?? "",
      globalEntry: m.globalEntry ?? "",
      nexus: m.nexus ?? "",
      frequentFlyer: m.frequentFlyer ?? "",
      seatPreference: m.seatPreference ?? "",
      mealPreference: m.mealPreference ?? "",
      breed: m.breed ?? "",
      vet: m.vet ?? "",
      microchip: m.microchip ?? "",
      feedingSchedule: m.feedingSchedule ?? "",
      walkSchedule: m.walkSchedule ?? "",
      vaccinations: m.vaccinations ?? "",
    });
    setModalPhotoFile(null);
    setModalPhotoPreview(null);
    setCurrentPhotoUrl(m.photoUrl);
    setModalError("");
    setModalOpen(true);
  }

  function handleModalPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setModalPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (modalFileRef.current) modalFileRef.current.value = "";
  }

  async function uploadPhotoToMember(memberId: string, file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/family/${memberId}/photo`, { method: "POST", body: fd });
    if (res.ok) {
      const updated = await res.json();
      return updated.photoUrl ?? null;
    }
    return null;
  }

  async function saveMember() {
    if (!form.name.trim()) { setModalError("Name is required."); return; }
    setSaving(true);
    setModalError("");
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        petType: form.type === "PET" ? nullify(form.petType) : null,
        bio: nullify(form.bio),
        birthdate: nullify(form.birthdate),
        height: nullify(form.height),
        weight: nullify(form.weight),
        bloodType: nullify(form.bloodType),
        allergies: nullify(form.allergies),
        medications: nullify(form.medications),
        dietaryRestrictions: nullify(form.dietaryRestrictions),
        dislikes: nullify(form.dislikes),
        thingsToKnow: nullify(form.thingsToKnow),
        favoriteFood: nullify(form.favoriteFood),
        school: form.type === "PERSON" ? nullify(form.school) : null,
        grade: form.type === "PERSON" ? nullify(form.grade) : null,
        teacher: form.type === "PERSON" ? nullify(form.teacher) : null,
        activities: form.type === "PERSON" ? nullify(form.activities) : null,
        doctor: form.type === "PERSON" ? nullify(form.doctor) : null,
        dentist: form.type === "PERSON" ? nullify(form.dentist) : null,
        passportNumber: form.type === "PERSON" ? nullify(form.passportNumber) : null,
        passportExpiry: form.type === "PERSON" ? nullify(form.passportExpiry) : null,
        passportCountry: form.type === "PERSON" ? nullify(form.passportCountry) : null,
        tsaPrecheck: form.type === "PERSON" ? nullify(form.tsaPrecheck) : null,
        globalEntry: form.type === "PERSON" ? nullify(form.globalEntry) : null,
        nexus: form.type === "PERSON" ? nullify(form.nexus) : null,
        frequentFlyer: form.type === "PERSON" ? nullify(form.frequentFlyer) : null,
        seatPreference: form.type === "PERSON" ? nullify(form.seatPreference) : null,
        mealPreference: form.type === "PERSON" ? nullify(form.mealPreference) : null,
        breed: form.type === "PET" ? nullify(form.breed) : null,
        vet: form.type === "PET" ? nullify(form.vet) : null,
        microchip: form.type === "PET" ? nullify(form.microchip) : null,
        feedingSchedule: form.type === "PET" ? nullify(form.feedingSchedule) : null,
        walkSchedule: form.type === "PET" ? nullify(form.walkSchedule) : null,
        vaccinations: form.type === "PET" ? nullify(form.vaccinations) : null,
      };

      const res = editingId
        ? await fetch(`/api/family/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) {
        const d = await res.json();
        setModalError(d.error ?? "Failed to save.");
        return;
      }

      const saved: FamilyMember = await res.json();

      // Upload photo if one was selected in the modal
      if (modalPhotoFile) {
        const photoUrl = await uploadPhotoToMember(saved.id, modalPhotoFile);
        if (photoUrl) saved.photoUrl = photoUrl;
      }

      setModalOpen(false);
      await load();
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

  // Card photo click (quick upload without opening modal)
  function handleCardPhotoClick(memberId: string) {
    setCardPhotoMemberId(memberId);
    cardFileRef.current?.click();
  }

  function handleCardFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && cardPhotoMemberId) {
      setUploadingPhotoFor(cardPhotoMemberId);
      uploadPhotoToMember(cardPhotoMemberId, file).then((url) => {
        if (url) setMembers((prev) => prev.map((m) => m.id === cardPhotoMemberId ? { ...m, photoUrl: url } : m));
        setUploadingPhotoFor(null);
      });
    }
    if (cardFileRef.current) cardFileRef.current.value = "";
  }

  // House Rules
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

  function setF(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const people = members.filter((m) => m.type === "PERSON");
  const pets = members.filter((m) => m.type === "PET");

  const photoToShow = modalPhotoPreview ?? currentPhotoUrl;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Hidden file inputs */}
      <input ref={modalFileRef} type="file" accept="image/*" className="hidden" onChange={handleModalPhotoChange} />
      <input ref={cardFileRef} type="file" accept="image/*" className="hidden" onChange={handleCardFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Bio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Document your family members, pets, and house rules for your house manager.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd("PERSON")} className="btn-secondary text-sm px-3 py-2">+ Add Person</button>
          <button onClick={() => openAdd("PET")} className="btn-primary text-sm px-3 py-2">🐾 Add Pet</button>
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
                        onPhotoClick={() => handleCardPhotoClick(m.id)}
                        uploadingPhoto={uploadingPhotoFor === m.id}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                </div>
              )}
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
                        onPhotoClick={() => handleCardPhotoClick(m.id)}
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
                          <button onClick={() => { setEditingRuleId(r.id); setEditingRuleText(r.rule); }} className="text-xs text-slate-400 hover:text-brand-600 transition">Edit</button>
                          <button onClick={() => deleteRule(r.id)} disabled={deletingRuleId === r.id} className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50">
                            {deletingRuleId === r.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                <button onClick={addRule} disabled={addingRule || !newRule.trim()} className="btn-primary text-sm px-4 disabled:opacity-50">
                  {addingRule ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit" : "Add"} {form.type === "PERSON" ? "Family Member" : "Pet"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Type toggle (add only) */}
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

              {/* ── Photo ── */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                    {photoToShow ? (
                      <img src={photoToShow} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{form.type === "PET" ? "🐾" : "👤"}</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => modalFileRef.current?.click()}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      {photoToShow ? "Change Photo" : "Upload Photo"}
                    </button>
                    {modalPhotoFile && (
                      <p className="text-xs text-slate-400 mt-1">{modalPhotoFile.name}</p>
                    )}
                    {!modalPhotoFile && !currentPhotoUrl && (
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF · Max 10 MB</p>
                    )}
                    {(modalPhotoFile || currentPhotoUrl) && (
                      <button
                        type="button"
                        onClick={() => { setModalPhotoFile(null); setModalPhotoPreview(null); setCurrentPhotoUrl(null); }}
                        className="text-xs text-red-400 hover:text-red-600 mt-1 block"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION: Basic Info ── */}
              <FormSection label="Basic Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FieldLabel>{form.type === "PERSON" ? "Full Name" : "Pet Name"} *</FieldLabel>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setF("name", e.target.value)}
                      className="input w-full"
                      placeholder={form.type === "PERSON" ? "e.g. Sarah Smith" : "e.g. Max"}
                    />
                  </div>

                  {form.type === "PET" && (
                    <div className="sm:col-span-2">
                      <FieldLabel>Pet Type</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {PET_TYPES.map((pt) => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setF("petType", form.petType === pt ? "" : pt)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition border ${form.petType === pt ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200 text-slate-600 hover:border-brand-400"}`}
                          >
                            {pt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.type === "PET" && (
                    <div>
                      <FieldLabel>Breed</FieldLabel>
                      <input type="text" value={form.breed} onChange={(e) => setF("breed", e.target.value)} className="input w-full" placeholder="e.g. Golden Retriever" />
                    </div>
                  )}

                  <div>
                    <FieldLabel>Birthday</FieldLabel>
                    <input type="text" value={form.birthdate} onChange={(e) => setF("birthdate", e.target.value)} className="input w-full" placeholder="e.g. March 15, 2010" />
                  </div>

                  <div>
                    <FieldLabel>Weight</FieldLabel>
                    <input type="text" value={form.weight} onChange={(e) => setF("weight", e.target.value)} className="input w-full" placeholder="e.g. 65 lbs" />
                  </div>

                  {form.type === "PERSON" && (
                    <>
                      <div>
                        <FieldLabel>Height</FieldLabel>
                        <input type="text" value={form.height} onChange={(e) => setF("height", e.target.value)} className="input w-full" placeholder="e.g. 5′ 6″" />
                      </div>

                      <div>
                        <FieldLabel>Blood Type</FieldLabel>
                        <select value={form.bloodType} onChange={(e) => setF("bloodType", e.target.value)} className="input w-full">
                          <option value="">Unknown / not set</option>
                          {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </FormSection>

              {/* ── SECTION: School & Activities (Person only) ── */}
              {form.type === "PERSON" && (
                <FormSection label="School & Activities">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>School</FieldLabel>
                      <input type="text" value={form.school} onChange={(e) => setF("school", e.target.value)} className="input w-full" placeholder="e.g. Lincoln Elementary" />
                    </div>
                    <div>
                      <FieldLabel>Grade</FieldLabel>
                      <input type="text" value={form.grade} onChange={(e) => setF("grade", e.target.value)} className="input w-full" placeholder="e.g. 3rd Grade" />
                    </div>
                    <div>
                      <FieldLabel>Teacher</FieldLabel>
                      <input type="text" value={form.teacher} onChange={(e) => setF("teacher", e.target.value)} className="input w-full" placeholder="e.g. Ms. Johnson" />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Activities & Extracurriculars</FieldLabel>
                      <textarea value={form.activities} onChange={(e) => setF("activities", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. Soccer Mon/Wed 4pm, Piano lessons Friday 3pm…" />
                    </div>
                  </div>
                </FormSection>
              )}

              {/* ── SECTION: Medical ── */}
              <FormSection label="Medical">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {form.type === "PERSON" && (
                    <>
                      <div>
                        <FieldLabel>Primary Doctor</FieldLabel>
                        <input type="text" value={form.doctor} onChange={(e) => setF("doctor", e.target.value)} className="input w-full" placeholder="Dr. Smith · (555) 123-4567" />
                      </div>
                      <div>
                        <FieldLabel>Dentist</FieldLabel>
                        <input type="text" value={form.dentist} onChange={(e) => setF("dentist", e.target.value)} className="input w-full" placeholder="Dr. Jones · (555) 987-6543" />
                      </div>
                    </>
                  )}
                  {form.type === "PET" && (
                    <>
                      <div>
                        <FieldLabel>Veterinarian</FieldLabel>
                        <input type="text" value={form.vet} onChange={(e) => setF("vet", e.target.value)} className="input w-full" placeholder="Animal Hospital · (555) 123-4567" />
                      </div>
                      <div>
                        <FieldLabel>Microchip #</FieldLabel>
                        <input type="text" value={form.microchip} onChange={(e) => setF("microchip", e.target.value)} className="input w-full" placeholder="e.g. 985121234567890" />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Vaccinations</FieldLabel>
                        <textarea value={form.vaccinations} onChange={(e) => setF("vaccinations", e.target.value)} rows={2} className="input w-full resize-none" placeholder="Rabies (exp 2026), Bordetella (exp 2025)…" />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <FieldLabel>Allergies</FieldLabel>
                    <textarea value={form.allergies} onChange={(e) => setF("allergies", e.target.value)} rows={2} className="input w-full resize-none" placeholder="List any allergies or sensitivities…" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Medications</FieldLabel>
                    <textarea value={form.medications} onChange={(e) => setF("medications", e.target.value)} rows={2} className="input w-full resize-none" placeholder="Current medications, dosage, and schedule…" />
                  </div>
                </div>
              </FormSection>

              {/* ── SECTION: Pet Routine (Pet only) ── */}
              {form.type === "PET" && (
                <FormSection label="Daily Routine">
                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Feeding Schedule</FieldLabel>
                      <textarea value={form.feedingSchedule} onChange={(e) => setF("feedingSchedule", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. 1 cup dry food at 7am and 6pm…" />
                    </div>
                    <div>
                      <FieldLabel>Walk Schedule</FieldLabel>
                      <textarea value={form.walkSchedule} onChange={(e) => setF("walkSchedule", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. 30-min walk at 7am, 12pm, and 6pm…" />
                    </div>
                  </div>
                </FormSection>
              )}

              {/* ── SECTION: Travel & Documents (Person only) ── */}
              {form.type === "PERSON" && (
                <FormSection label="Travel & Documents">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Passport Number</FieldLabel>
                      <input type="text" value={form.passportNumber} onChange={(e) => setF("passportNumber", e.target.value)} className="input w-full" placeholder="e.g. US123456789" />
                    </div>
                    <div>
                      <FieldLabel>Passport Expiry</FieldLabel>
                      <input type="text" value={form.passportExpiry} onChange={(e) => setF("passportExpiry", e.target.value)} className="input w-full" placeholder="e.g. June 2028" />
                    </div>
                    <div>
                      <FieldLabel>Passport Country</FieldLabel>
                      <input type="text" value={form.passportCountry} onChange={(e) => setF("passportCountry", e.target.value)} className="input w-full" placeholder="e.g. United States" />
                    </div>
                    <div>
                      <FieldLabel>TSA PreCheck #</FieldLabel>
                      <input type="text" value={form.tsaPrecheck} onChange={(e) => setF("tsaPrecheck", e.target.value)} className="input w-full" placeholder="Known Traveler Number" />
                    </div>
                    <div>
                      <FieldLabel>Global Entry #</FieldLabel>
                      <input type="text" value={form.globalEntry} onChange={(e) => setF("globalEntry", e.target.value)} className="input w-full" placeholder="Membership number" />
                    </div>
                    <div>
                      <FieldLabel>NEXUS #</FieldLabel>
                      <input type="text" value={form.nexus} onChange={(e) => setF("nexus", e.target.value)} className="input w-full" placeholder="NEXUS number" />
                    </div>
                    <div>
                      <FieldLabel>Seat Preference</FieldLabel>
                      <input type="text" value={form.seatPreference} onChange={(e) => setF("seatPreference", e.target.value)} className="input w-full" placeholder="e.g. Aisle, Window, Exit row" />
                    </div>
                    <div>
                      <FieldLabel>Meal Preference</FieldLabel>
                      <input type="text" value={form.mealPreference} onChange={(e) => setF("mealPreference", e.target.value)} className="input w-full" placeholder="e.g. Vegetarian, Kosher, Halal" />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Frequent Flyer / Loyalty Programs</FieldLabel>
                      <textarea value={form.frequentFlyer} onChange={(e) => setF("frequentFlyer", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. United MileagePlus #12345678, Delta SkyMiles #87654321…" />
                    </div>
                  </div>
                </FormSection>
              )}

              {/* ── SECTION: Diet & Food ── */}
              <FormSection label="Diet & Food">
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Dietary Restrictions</FieldLabel>
                    <textarea value={form.dietaryRestrictions} onChange={(e) => setF("dietaryRestrictions", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. Gluten-free, nut-free, vegetarian…" />
                  </div>
                  <div>
                    <FieldLabel>Favorite Foods</FieldLabel>
                    <textarea value={form.favoriteFood} onChange={(e) => setF("favoriteFood", e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. Pizza, spaghetti, chocolate ice cream…" />
                  </div>
                  <div>
                    <FieldLabel>Dislikes</FieldLabel>
                    <textarea value={form.dislikes} onChange={(e) => setF("dislikes", e.target.value)} rows={2} className="input w-full resize-none" placeholder="Foods or things they don't like…" />
                  </div>
                </div>
              </FormSection>

              {/* ── SECTION: About ── */}
              <FormSection label="About">
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Bio / Introduction</FieldLabel>
                    <textarea value={form.bio} onChange={(e) => setF("bio", e.target.value)} rows={3} className="input w-full resize-none" placeholder={form.type === "PERSON" ? "Personality, interests, hobbies…" : "Personality, temperament, quirks…"} />
                  </div>
                  <div>
                    <FieldLabel>Things to Know</FieldLabel>
                    <textarea value={form.thingsToKnow} onChange={(e) => setF("thingsToKnow", e.target.value)} rows={3} className="input w-full resize-none" placeholder="Important notes or anything your house manager should know…" />
                  </div>
                </div>
              </FormSection>

              {modalError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end sticky bottom-0 bg-white rounded-b-2xl">
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

// ── Helper components ───────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600 mb-1">{children}</label>;
}

// ── Member Card Component ───────────────────────────────────────────────────

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

  // Build grouped details for the expand section
  const personDetails: { label: string; value: string | null }[] = member.type === "PERSON" ? [
    { label: "Birthday", value: member.birthdate },
    { label: "Height", value: member.height },
    { label: "Weight", value: member.weight },
    { label: "Blood Type", value: member.bloodType },
    { label: "School", value: member.school },
    { label: "Grade", value: member.grade },
    { label: "Teacher", value: member.teacher },
    { label: "Activities", value: member.activities },
    { label: "Doctor", value: member.doctor },
    { label: "Dentist", value: member.dentist },
    { label: "Allergies", value: member.allergies },
    { label: "Medications", value: member.medications },
    { label: "Dietary Restrictions", value: member.dietaryRestrictions },
    { label: "Favorite Foods", value: member.favoriteFood },
    { label: "Dislikes", value: member.dislikes },
    { label: "Passport #", value: member.passportNumber },
    { label: "Passport Expiry", value: member.passportExpiry },
    { label: "Passport Country", value: member.passportCountry },
    { label: "TSA PreCheck", value: member.tsaPrecheck },
    { label: "Global Entry", value: member.globalEntry },
    { label: "NEXUS", value: member.nexus },
    { label: "Frequent Flyer", value: member.frequentFlyer },
    { label: "Seat Preference", value: member.seatPreference },
    { label: "Meal Preference", value: member.mealPreference },
    { label: "Things to Know", value: member.thingsToKnow },
  ] : [
    { label: "Breed", value: member.breed },
    { label: "Birthday", value: member.birthdate },
    { label: "Weight", value: member.weight },
    { label: "Vet", value: member.vet },
    { label: "Microchip #", value: member.microchip },
    { label: "Vaccinations", value: member.vaccinations },
    { label: "Allergies", value: member.allergies },
    { label: "Medications", value: member.medications },
    { label: "Feeding Schedule", value: member.feedingSchedule },
    { label: "Walk Schedule", value: member.walkSchedule },
    { label: "Dietary Restrictions", value: member.dietaryRestrictions },
    { label: "Favorite Foods", value: member.favoriteFood },
    { label: "Dislikes", value: member.dislikes },
    { label: "Things to Know", value: member.thingsToKnow },
  ];

  const filledDetails = personDetails.filter((d) => d.value);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex gap-4">
        {/* Photo */}
        <div className="shrink-0">
          <button
            onClick={onPhotoClick}
            disabled={uploadingPhoto}
            className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 block hover:opacity-80 transition group"
            title="Click to change photo"
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
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {member.type === "PET" && member.petType && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">{member.petType}</span>
                )}
                {member.type === "PET" && member.breed && (
                  <span className="text-xs text-slate-400">{member.breed}</span>
                )}
                {member.birthdate && (
                  <span className="text-xs text-slate-400">🎂 {member.birthdate}</span>
                )}
                {member.type === "PERSON" && member.school && (
                  <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">🎓 {member.school}</span>
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
      {filledDetails.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
          >
            <span>{expanded ? "Hide" : "Show"} details ({filledDetails.length} field{filledDetails.length !== 1 ? "s" : ""})</span>
            <span>{expanded ? "▲" : "▼"}</span>
          </button>
          {expanded && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {filledDetails.map((d) => (
                  <div key={d.label}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{d.label}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
