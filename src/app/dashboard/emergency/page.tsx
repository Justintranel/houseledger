"use client";
import { useState, useEffect, useCallback } from "react";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface WorkplaceContact {
  id: string;
  name: string;
  employer: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface EmergencyFacility {
  id: string;
  type: "HOSPITAL" | "VET";
  name: string;
  address: string | null;
  phone: string | null;
  distance: string | null;
  notes: string | null;
  isPreferred: boolean;
}

interface EmergencyInsurance {
  carrier: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  memberName: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

const EMPTY_CONTACT = { name: "", relationship: "", phone: "", email: "", notes: "" };
const EMPTY_WORKPLACE = { name: "", employer: "", title: "", phone: "", email: "", address: "", notes: "" };
const EMPTY_FACILITY = (type: "HOSPITAL" | "VET") => ({ type, name: "", address: "", phone: "", distance: "", notes: "", isPreferred: false });
const EMPTY_INSURANCE: EmergencyInsurance = { carrier: "", policyNumber: "", groupNumber: "", memberName: "", phone: "", website: "", notes: "" };

function normalizeUrl(url: string): string {
  const t = url.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default function EmergencyInfoPage() {
  const [tab, setTab] = useState<"insurance" | "contacts" | "workplace" | "hospitals" | "vets">("insurance");

  // Insurance
  const [insurance, setInsurance] = useState<EmergencyInsurance>(EMPTY_INSURANCE);
  const [insuranceSaving, setInsuranceSaving] = useState(false);
  const [insuranceSaved, setInsuranceSaved] = useState(false);
  const [insuranceError, setInsuranceError] = useState("");

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // Workplace Contacts
  const [workplaceContacts, setWorkplaceContacts] = useState<WorkplaceContact[]>([]);

  // Facilities
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);

  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalType, setModalType] = useState<"contact" | "workplace" | "hospital" | "vet" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [workplaceForm, setWorkplaceForm] = useState(EMPTY_WORKPLACE);
  const [facilityForm, setFacilityForm] = useState(EMPTY_FACILITY("HOSPITAL"));
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, cRes, wRes, fRes] = await Promise.all([
        fetch("/api/emergency/insurance"),
        fetch("/api/emergency/contacts"),
        fetch("/api/emergency/workplace"),
        fetch("/api/emergency/facilities"),
      ]);
      if (iRes.ok) {
        const d = await iRes.json();
        if (d) setInsurance({
          carrier: d.carrier ?? "",
          policyNumber: d.policyNumber ?? "",
          groupNumber: d.groupNumber ?? "",
          memberName: d.memberName ?? "",
          phone: d.phone ?? "",
          website: d.website ?? "",
          notes: d.notes ?? "",
        });
      }
      if (cRes.ok) setContacts(await cRes.json());
      if (wRes.ok) setWorkplaceContacts(await wRes.json());
      if (fRes.ok) setFacilities(await fRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveInsurance(e: React.FormEvent) {
    e.preventDefault();
    setInsuranceSaving(true);
    setInsuranceError("");
    try {
      const payload = {
        ...insurance,
        website: insurance.website ? normalizeUrl(insurance.website) : null,
        carrier: insurance.carrier || null,
        policyNumber: insurance.policyNumber || null,
        groupNumber: insurance.groupNumber || null,
        memberName: insurance.memberName || null,
        phone: insurance.phone || null,
        notes: insurance.notes || null,
      };
      const res = await fetch("/api/emergency/insurance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setInsuranceSaved(true);
        setTimeout(() => setInsuranceSaved(false), 3000);
      } else {
        const d = await res.json();
        setInsuranceError(d.error ?? "Failed to save.");
      }
    } finally {
      setInsuranceSaving(false);
    }
  }

  // ── Emergency Contact modal ─────────────────────────────────────────────────
  function openAddContact() {
    setEditingId(null); setContactForm(EMPTY_CONTACT); setModalError(""); setModalType("contact");
  }
  function openEditContact(c: EmergencyContact) {
    setEditingId(c.id);
    setContactForm({ name: c.name, relationship: c.relationship ?? "", phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" });
    setModalError(""); setModalType("contact");
  }
  async function saveContact() {
    if (!contactForm.name.trim()) { setModalError("Name is required."); return; }
    setModalSaving(true); setModalError("");
    try {
      const payload = {
        name: contactForm.name.trim(),
        relationship: contactForm.relationship.trim() || null,
        phone: contactForm.phone.trim() || null,
        email: contactForm.email.trim() || null,
        notes: contactForm.notes.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/emergency/contacts/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/emergency/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setModalType(null); await load(); }
      else { const d = await res.json(); setModalError(d.error ?? "Failed to save."); }
    } finally { setModalSaving(false); }
  }
  async function deleteContact(id: string) {
    if (!confirm("Remove this emergency contact?")) return;
    setDeletingId(id);
    try { await fetch(`/api/emergency/contacts/${id}`, { method: "DELETE" }); setContacts((p) => p.filter((c) => c.id !== id)); }
    finally { setDeletingId(null); }
  }

  // ── Workplace Contact modal ─────────────────────────────────────────────────
  function openAddWorkplace() {
    setEditingId(null); setWorkplaceForm(EMPTY_WORKPLACE); setModalError(""); setModalType("workplace");
  }
  function openEditWorkplace(w: WorkplaceContact) {
    setEditingId(w.id);
    setWorkplaceForm({ name: w.name, employer: w.employer ?? "", title: w.title ?? "", phone: w.phone ?? "", email: w.email ?? "", address: w.address ?? "", notes: w.notes ?? "" });
    setModalError(""); setModalType("workplace");
  }
  async function saveWorkplace() {
    if (!workplaceForm.name.trim()) { setModalError("Name is required."); return; }
    setModalSaving(true); setModalError("");
    try {
      const payload = {
        name: workplaceForm.name.trim(),
        employer: workplaceForm.employer.trim() || null,
        title: workplaceForm.title.trim() || null,
        phone: workplaceForm.phone.trim() || null,
        email: workplaceForm.email.trim() || null,
        address: workplaceForm.address.trim() || null,
        notes: workplaceForm.notes.trim() || null,
      };
      const res = editingId
        ? await fetch(`/api/emergency/workplace/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/emergency/workplace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setModalType(null); await load(); }
      else { const d = await res.json(); setModalError(d.error ?? "Failed to save."); }
    } finally { setModalSaving(false); }
  }
  async function deleteWorkplace(id: string) {
    if (!confirm("Remove this workplace contact?")) return;
    setDeletingId(id);
    try { await fetch(`/api/emergency/workplace/${id}`, { method: "DELETE" }); setWorkplaceContacts((p) => p.filter((w) => w.id !== id)); }
    finally { setDeletingId(null); }
  }

  // ── Facility modal ──────────────────────────────────────────────────────────
  function openAddFacility(type: "HOSPITAL" | "VET") {
    setEditingId(null); setFacilityForm(EMPTY_FACILITY(type)); setModalError(""); setModalType(type === "HOSPITAL" ? "hospital" : "vet");
  }
  function openEditFacility(f: EmergencyFacility) {
    setEditingId(f.id);
    setFacilityForm({ type: f.type, name: f.name, address: f.address ?? "", phone: f.phone ?? "", distance: f.distance ?? "", notes: f.notes ?? "", isPreferred: f.isPreferred });
    setModalError(""); setModalType(f.type === "HOSPITAL" ? "hospital" : "vet");
  }
  async function saveFacility() {
    if (!facilityForm.name.trim()) { setModalError("Name is required."); return; }
    setModalSaving(true); setModalError("");
    try {
      const payload = {
        type: facilityForm.type, name: facilityForm.name.trim(),
        address: facilityForm.address.trim() || null, phone: facilityForm.phone.trim() || null,
        distance: facilityForm.distance.trim() || null, notes: facilityForm.notes.trim() || null,
        isPreferred: facilityForm.isPreferred,
      };
      const res = editingId
        ? await fetch(`/api/emergency/facilities/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/emergency/facilities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setModalType(null); await load(); }
      else { const d = await res.json(); setModalError(d.error ?? "Failed to save."); }
    } finally { setModalSaving(false); }
  }
  async function deleteFacility(id: string) {
    if (!confirm("Remove this facility?")) return;
    setDeletingId(id);
    try { await fetch(`/api/emergency/facilities/${id}`, { method: "DELETE" }); setFacilities((p) => p.filter((f) => f.id !== id)); }
    finally { setDeletingId(null); }
  }

  const hospitals = facilities.filter((f) => f.type === "HOSPITAL");
  const vets = facilities.filter((f) => f.type === "VET");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Emergency Info</h1>
        <p className="text-sm text-slate-500 mt-0.5">Keep critical emergency information organized and accessible for your house manager.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 flex-wrap">
        {([
          ["insurance",  "🏥", "Health Insurance"],
          ["contacts",   "📞", "Emergency Contacts"],
          ["workplace",  "💼", "Workplace Contacts"],
          ["hospitals",  "🏨", "Hospitals & Urgent Care"],
          ["vets",       "🐾", "Emergency Vets"],
        ] as const).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === key ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* INSURANCE TAB */}
          {tab === "insurance" && (
            <div className="max-w-2xl">
              <form onSubmit={saveInsurance} className="card p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">🏥 Health Insurance</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Insurance Carrier</label>
                    <input type="text" value={insurance.carrier ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, carrier: e.target.value }))} className="input w-full" placeholder="e.g. Blue Cross Blue Shield" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Number</label>
                    <input type="text" value={insurance.policyNumber ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, policyNumber: e.target.value }))} className="input w-full" placeholder="e.g. XYZ123456" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Group Number</label>
                    <input type="text" value={insurance.groupNumber ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, groupNumber: e.target.value }))} className="input w-full" placeholder="e.g. GRP789" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Member Name</label>
                    <input type="text" value={insurance.memberName ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, memberName: e.target.value }))} className="input w-full" placeholder="e.g. John Smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Insurance Phone</label>
                    <input type="text" value={insurance.phone ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, phone: e.target.value }))} className="input w-full" placeholder="e.g. 1-800-555-0100" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Website (optional)</label>
                    <input type="text" value={insurance.website ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, website: e.target.value }))} className="input w-full" placeholder="e.g. www.bcbs.com" />
                    <p className="text-xs text-slate-400 mt-0.5">Any URL format works — https:// added automatically if missing.</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                    <textarea value={insurance.notes ?? ""} onChange={(e) => setInsurance((p) => ({ ...p, notes: e.target.value }))} rows={3} className="input w-full resize-none" placeholder="Co-pays, deductibles, coverage notes…" />
                  </div>
                </div>
                {insuranceError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{insuranceError}</p>}
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={insuranceSaving} className="btn-primary text-sm">{insuranceSaving ? "Saving…" : "Save Insurance Info"}</button>
                  {insuranceSaved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
                </div>
              </form>
            </div>
          )}

          {/* EMERGENCY CONTACTS TAB */}
          {tab === "contacts" && (
            <div className="max-w-2xl space-y-4">
              <div className="flex justify-end">
                <button onClick={openAddContact} className="btn-primary text-sm px-4">+ Add Contact</button>
              </div>
              {contacts.length === 0 ? (
                <EmptyState emoji="📞" message="No emergency contacts yet" sub="Add family doctors, neighbors, or other key contacts." onAdd={openAddContact} addLabel="Add Contact" />
              ) : (
                <div className="card p-0 overflow-hidden divide-y divide-slate-100">
                  {contacts.map((c) => (
                    <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          {c.relationship && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c.relationship}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                          {c.phone && <a href={`tel:${c.phone}`} className="text-sm text-brand-600 hover:underline">📞 {c.phone}</a>}
                          {c.email && <a href={`mailto:${c.email}`} className="text-sm text-slate-500 hover:underline truncate">✉️ {c.email}</a>}
                        </div>
                        {c.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.notes}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditContact(c)} className="text-xs text-slate-400 hover:text-brand-600 transition">Edit</button>
                        <button onClick={() => deleteContact(c.id)} disabled={deletingId === c.id} className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50">{deletingId === c.id ? "…" : "Remove"}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WORKPLACE CONTACTS TAB */}
          {tab === "workplace" && (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-500">Work contact info for family members — useful if your manager needs to reach someone urgently during work hours.</p>
                <button onClick={openAddWorkplace} className="btn-primary text-sm px-4 shrink-0">+ Add Contact</button>
              </div>
              {workplaceContacts.length === 0 ? (
                <EmptyState emoji="💼" message="No workplace contacts yet" sub="Add work contact details for family members." onAdd={openAddWorkplace} addLabel="Add Workplace Contact" />
              ) : (
                <div className="card p-0 overflow-hidden divide-y divide-slate-100">
                  {workplaceContacts.map((w) => (
                    <div key={w.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{w.name}</p>
                          {w.title && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{w.title}</span>}
                        </div>
                        {w.employer && <p className="text-sm text-slate-600 mt-0.5 font-medium">🏢 {w.employer}</p>}
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                          {w.phone && <a href={`tel:${w.phone}`} className="text-sm text-brand-600 hover:underline">📞 {w.phone}</a>}
                          {w.email && <a href={`mailto:${w.email}`} className="text-sm text-slate-500 hover:underline truncate">✉️ {w.email}</a>}
                        </div>
                        {w.address && <p className="text-xs text-slate-400 mt-1">📍 {w.address}</p>}
                        {w.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{w.notes}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditWorkplace(w)} className="text-xs text-slate-400 hover:text-brand-600 transition">Edit</button>
                        <button onClick={() => deleteWorkplace(w.id)} disabled={deletingId === w.id} className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50">{deletingId === w.id ? "…" : "Remove"}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOSPITALS TAB */}
          {tab === "hospitals" && (
            <FacilityTab title="Hospitals & Urgent Care" emoji="🏨" type="HOSPITAL" facilities={hospitals}
              onAdd={() => openAddFacility("HOSPITAL")} onEdit={openEditFacility} onDelete={deleteFacility} deletingId={deletingId} />
          )}

          {/* VETS TAB */}
          {tab === "vets" && (
            <FacilityTab title="Emergency Veterinarians" emoji="🐾" type="VET" facilities={vets}
              onAdd={() => openAddFacility("VET")} onEdit={openEditFacility} onDelete={deleteFacility} deletingId={deletingId} />
          )}

        </>
      )}

      {/* EMERGENCY CONTACT MODAL */}
      {modalType === "contact" && (
        <Modal title={editingId ? "Edit Contact" : "Add Emergency Contact"} onClose={() => setModalType(null)}>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                <input type="text" value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} className="input w-full" placeholder="e.g. Dr. Sarah Johnson" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship</label>
                <input type="text" value={contactForm.relationship} onChange={(e) => setContactForm((f) => ({ ...f, relationship: e.target.value }))} className="input w-full" placeholder="e.g. Family Doctor" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input type="text" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="(555) 123-4567" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="text" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="doctor@clinic.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={contactForm.notes} onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="Additional info…" />
              </div>
            </div>
            {modalError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
            <button onClick={() => setModalType(null)} className="btn-secondary text-sm px-4">Cancel</button>
            <button onClick={saveContact} disabled={modalSaving} className="btn-primary text-sm px-5">{modalSaving ? "Saving…" : editingId ? "Save Changes" : "Add Contact"}</button>
          </div>
        </Modal>
      )}

      {/* WORKPLACE CONTACT MODAL */}
      {modalType === "workplace" && (
        <Modal title={editingId ? "Edit Workplace Contact" : "Add Workplace Contact"} onClose={() => setModalType(null)}>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Person's Name *</label>
                <input type="text" value={workplaceForm.name} onChange={(e) => setWorkplaceForm((f) => ({ ...f, name: e.target.value }))} className="input w-full" placeholder="e.g. John Smith" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employer / Company</label>
                <input type="text" value={workplaceForm.employer} onChange={(e) => setWorkplaceForm((f) => ({ ...f, employer: e.target.value }))} className="input w-full" placeholder="e.g. Acme Corporation" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                <input type="text" value={workplaceForm.title} onChange={(e) => setWorkplaceForm((f) => ({ ...f, title: e.target.value }))} className="input w-full" placeholder="e.g. Senior Manager" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Phone</label>
                <input type="text" value={workplaceForm.phone} onChange={(e) => setWorkplaceForm((f) => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email</label>
                <input type="text" value={workplaceForm.email} onChange={(e) => setWorkplaceForm((f) => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="john@acme.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Address</label>
                <input type="text" value={workplaceForm.address} onChange={(e) => setWorkplaceForm((f) => ({ ...f, address: e.target.value }))} className="input w-full" placeholder="123 Business Ave, Suite 100, City, State" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={workplaceForm.notes} onChange={(e) => setWorkplaceForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="Office hours, building access, receptionist name…" />
              </div>
            </div>
            {modalError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
            <button onClick={() => setModalType(null)} className="btn-secondary text-sm px-4">Cancel</button>
            <button onClick={saveWorkplace} disabled={modalSaving} className="btn-primary text-sm px-5">{modalSaving ? "Saving…" : editingId ? "Save Changes" : "Add Contact"}</button>
          </div>
        </Modal>
      )}

      {/* FACILITY MODAL */}
      {(modalType === "hospital" || modalType === "vet") && (
        <Modal title={editingId ? `Edit ${modalType === "hospital" ? "Hospital" : "Vet"}` : `Add ${modalType === "hospital" ? "Hospital / Urgent Care" : "Emergency Vet"}`} onClose={() => setModalType(null)}>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                <input type="text" value={facilityForm.name} onChange={(e) => setFacilityForm((f) => ({ ...f, name: e.target.value }))} className="input w-full" placeholder="e.g. Cedars-Sinai Medical Center" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={facilityForm.address} onChange={(e) => setFacilityForm((f) => ({ ...f, address: e.target.value }))} className="input w-full" placeholder="123 Medical Dr, Beverly Hills, CA" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input type="text" value={facilityForm.phone} onChange={(e) => setFacilityForm((f) => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="(310) 555-0100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Distance</label>
                <input type="text" value={facilityForm.distance} onChange={(e) => setFacilityForm((f) => ({ ...f, distance: e.target.value }))} className="input w-full" placeholder="e.g. 2.5 miles" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={facilityForm.notes} onChange={(e) => setFacilityForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="24/7 emergency, in-network, pediatric care…" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={facilityForm.isPreferred} onChange={(e) => setFacilityForm((f) => ({ ...f, isPreferred: e.target.checked }))} className="accent-brand-600 w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">Mark as preferred / primary location</span>
                </label>
              </div>
            </div>
            {modalError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
            <button onClick={() => setModalType(null)} className="btn-secondary text-sm px-4">Cancel</button>
            <button onClick={saveFacility} disabled={modalSaving} className="btn-primary text-sm px-5">{modalSaving ? "Saving…" : editingId ? "Save Changes" : "Add"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ emoji, message, sub, onAdd, addLabel }: { emoji: string; message: string; sub: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-slate-600 font-medium mb-1">{message}</p>
      <p className="text-slate-400 text-sm mb-4">{sub}</p>
      <button onClick={onAdd} className="btn-primary text-sm px-5">+ {addLabel}</button>
    </div>
  );
}

function FacilityTab({ title, emoji, type, facilities, onAdd, onEdit, onDelete, deletingId }: {
  title: string; emoji: string; type: string;
  facilities: EmergencyFacility[];
  onAdd: () => void; onEdit: (f: EmergencyFacility) => void; onDelete: (id: string) => void; deletingId: string | null;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="btn-primary text-sm px-4">+ Add {type === "HOSPITAL" ? "Hospital" : "Vet"}</button>
      </div>
      {facilities.length === 0 ? (
        <EmptyState emoji={emoji} message={`No ${title.toLowerCase()} saved`}
          sub={type === "HOSPITAL" ? "Add nearby hospitals and urgent care centers." : "Add emergency veterinarians for your pets."}
          onAdd={onAdd} addLabel={`Add ${type === "HOSPITAL" ? "Hospital" : "Vet"}`} />
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-slate-100">
          {facilities.map((f) => (
            <div key={f.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{f.name}</p>
                  {f.isPreferred && <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">⭐ Preferred</span>}
                </div>
                <div className="mt-1 space-y-0.5">
                  {f.address && <p className="text-sm text-slate-500">📍 {f.address}</p>}
                  <div className="flex flex-wrap gap-x-4">
                    {f.phone && <a href={`tel:${f.phone}`} className="text-sm text-brand-600 hover:underline">📞 {f.phone}</a>}
                    {f.distance && <p className="text-sm text-slate-400">🗺️ {f.distance}</p>}
                  </div>
                  {f.notes && <p className="text-xs text-slate-400 line-clamp-2">{f.notes}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onEdit(f)} className="text-xs text-slate-400 hover:text-brand-600 transition">Edit</button>
                <button onClick={() => onDelete(f.id)} disabled={deletingId === f.id} className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50">{deletingId === f.id ? "…" : "Remove"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
