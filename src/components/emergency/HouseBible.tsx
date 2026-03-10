"use client";
import { useState, useEffect, useCallback } from "react";

// ── Types passed in from Emergency Info ──────────────────────────────────────

interface EmergencyContact { id: string; name: string; relationship: string | null; phone: string | null; email: string | null; notes: string | null; }
interface WorkplaceContact { id: string; name: string; employer: string | null; title: string | null; phone: string | null; email: string | null; address: string | null; notes: string | null; }
interface EmergencyFacility { id: string; type: "HOSPITAL" | "VET"; name: string; address: string | null; phone: string | null; distance: string | null; notes: string | null; isPreferred: boolean; }
interface EmergencyInsurance { carrier: string | null; policyNumber: string | null; groupNumber: string | null; memberName: string | null; phone: string | null; website: string | null; notes: string | null; }

// ── Types fetched internally ─────────────────────────────────────────────────

interface FamilyMember {
  id: string; type: "PERSON" | "PET"; name: string; petType: string | null; breed: string | null;
  photoUrl: string | null; bio: string | null; birthdate: string | null; height: string | null;
  weight: string | null; bloodType: string | null; allergies: string | null; medications: string | null;
  dietaryRestrictions: string | null; dislikes: string | null; thingsToKnow: string | null; favoriteFood: string | null;
  school: string | null; grade: string | null; teacher: string | null; activities: string | null;
  doctor: string | null; dentist: string | null;
  passportNumber: string | null; passportExpiry: string | null; passportCountry: string | null;
  tsaPrecheck: string | null; globalEntry: string | null; nexus: string | null;
  frequentFlyer: string | null; seatPreference: string | null; mealPreference: string | null;
  vet: string | null; microchip: string | null; feedingSchedule: string | null;
  walkSchedule: string | null; vaccinations: string | null;
}

interface ProfileQuestion { id: string; prompt: string; category: string; answer: { answer: string } | null; }
interface HouseRule { id: string; rule: string; sortOrder: number; }
interface Vendor { id: string; name: string; type: string | null; category: string | null; phone: string | null; email: string | null; website: string | null; address: string | null; notes: string | null; preferred: boolean; }
interface SOP { id: string; name: string; notes: string | null; photos: { id: string; url: string; caption: string | null }[]; }
interface Vehicle { id: string; name: string; make: string | null; model: string | null; year: string | null; color: string | null; licensePlate: string | null; vin: string | null; notes: string | null; }
interface MaintenanceItem { id: string; title: string; category: string; vehicleId: string | null; intervalDays: number | null; lastDoneAt: string | null; nextDueAt: string | null; notes: string | null; }
interface TrainingVideo { id: string; title: string; description: string | null; url: string; }

interface Props {
  contacts: EmergencyContact[];
  workplaceContacts: WorkplaceContact[];
  facilities: EmergencyFacility[];
  insurance: EmergencyInsurance;
  householdName?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
}
function pf(label: string, value: string | null | undefined): string {
  return value ? `<div class="field"><span class="label">${label}:</span> <span class="value">${esc(value)}</span></div>` : "";
}
function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}

// ── Preview helpers ──────────────────────────────────────────────────────────

function BibleField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}: </span>
      <span className="text-sm text-slate-800 whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function PreviewSection({ emoji, title, count, children }: { emoji: string; title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{emoji}</span>
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
        </div>
        <span className="text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-5 pb-4 space-y-1 bg-slate-50 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function HouseBible({ contacts, workplaceContacts, facilities, insurance, householdName }: Props) {
  const [profile, setProfile] = useState<ProfileQuestion[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [training, setTraining] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, mRes, rRes, vRes, sRes, veRes, mainRes, tRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/family"),
        fetch("/api/house-rules"),
        fetch("/api/vendors"),
        fetch("/api/sop"),
        fetch("/api/vehicles"),
        fetch("/api/maintenance"),
        fetch("/api/training"),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (mRes.ok) setMembers(await mRes.json());
      if (rRes.ok) setRules(await rRes.json());
      if (vRes.ok) setVendors(await vRes.json());
      if (sRes.ok) setSops(await sRes.json());
      if (veRes.ok) setVehicles(await veRes.json());
      if (mainRes.ok) setMaintenance(await mainRes.json());
      if (tRes.ok) setTraining(await tRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const people = members.filter(m => m.type === "PERSON");
  const pets = members.filter(m => m.type === "PET");
  const hospitals = facilities.filter(f => f.type === "HOSPITAL");
  const vets = facilities.filter(f => f.type === "VET");
  const answeredProfile = profile.filter(q => q.answer?.answer);
  const houseMaintenance = maintenance.filter(m => !m.vehicleId);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Generate print HTML ───────────────────────────────────────────────────

  function buildPrintHTML(): string {
    // Group profile answers by category
    const profileCategories: Record<string, ProfileQuestion[]> = {};
    for (const q of answeredProfile) {
      if (!profileCategories[q.category]) profileCategories[q.category] = [];
      profileCategories[q.category].push(q);
    }

    const personBlock = (m: FamilyMember) => `
      <div class="member">
        <h3 class="member-name">${esc(m.name)}${m.birthdate ? ` <span class="sub">(${esc(m.birthdate)})</span>` : ""}${m.bloodType ? ` <span class="badge">${esc(m.bloodType)}</span>` : ""}</h3>
        ${m.bio ? `<p class="bio">${esc(m.bio)}</p>` : ""}
        ${pf("Height", m.height)}${pf("Weight", m.weight)}
        ${m.school || m.grade || m.teacher || m.activities ? `<div class="sub-section"><h4>School & Activities</h4>${pf("School", m.school)}${pf("Grade", m.grade)}${pf("Teacher", m.teacher)}${pf("Activities", m.activities)}</div>` : ""}
        ${m.doctor || m.dentist || m.allergies || m.medications ? `<div class="sub-section"><h4>Medical</h4>${pf("Doctor", m.doctor)}${pf("Dentist", m.dentist)}${pf("Allergies", m.allergies)}${pf("Medications", m.medications)}</div>` : ""}
        ${m.dietaryRestrictions || m.favoriteFood || m.dislikes ? `<div class="sub-section"><h4>Diet & Food</h4>${pf("Dietary Restrictions", m.dietaryRestrictions)}${pf("Favorite Foods", m.favoriteFood)}${pf("Dislikes", m.dislikes)}</div>` : ""}
        ${m.passportNumber || m.tsaPrecheck || m.globalEntry || m.nexus || m.frequentFlyer || m.seatPreference || m.mealPreference ? `<div class="sub-section"><h4>Travel & Documents</h4>${pf("Passport #", m.passportNumber)}${pf("Passport Expiry", m.passportExpiry)}${pf("Passport Country", m.passportCountry)}${pf("TSA PreCheck", m.tsaPrecheck)}${pf("Global Entry", m.globalEntry)}${pf("NEXUS", m.nexus)}${pf("Frequent Flyer", m.frequentFlyer)}${pf("Seat Preference", m.seatPreference)}${pf("Meal Preference", m.mealPreference)}</div>` : ""}
        ${m.thingsToKnow ? `<div class="sub-section"><h4>Things to Know</h4><p class="bio">${esc(m.thingsToKnow)}</p></div>` : ""}
      </div>`;

    const petBlock = (m: FamilyMember) => `
      <div class="member">
        <h3 class="member-name">${esc(m.name)}${m.petType ? ` <span class="badge">${esc(m.petType)}</span>` : ""}${m.breed ? ` <span class="sub">· ${esc(m.breed)}</span>` : ""}</h3>
        ${m.bio ? `<p class="bio">${esc(m.bio)}</p>` : ""}
        ${pf("Birthday", m.birthdate)}${pf("Weight", m.weight)}
        ${m.vet || m.microchip || m.vaccinations || m.allergies || m.medications ? `<div class="sub-section"><h4>Veterinary & Medical</h4>${pf("Vet", m.vet)}${pf("Microchip #", m.microchip)}${pf("Vaccinations", m.vaccinations)}${pf("Allergies", m.allergies)}${pf("Medications", m.medications)}</div>` : ""}
        ${m.feedingSchedule || m.walkSchedule ? `<div class="sub-section"><h4>Daily Routine</h4>${pf("Feeding", m.feedingSchedule)}${pf("Walks", m.walkSchedule)}</div>` : ""}
        ${m.dietaryRestrictions || m.favoriteFood || m.dislikes ? `<div class="sub-section"><h4>Diet & Food</h4>${pf("Dietary Restrictions", m.dietaryRestrictions)}${pf("Favorite Foods", m.favoriteFood)}${pf("Dislikes", m.dislikes)}</div>` : ""}
        ${m.thingsToKnow ? `<div class="sub-section"><h4>Things to Know</h4><p class="bio">${esc(m.thingsToKnow)}</p></div>` : ""}
      </div>`;

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${householdName ? esc(householdName) : "Household"} — House Bible</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Georgia, serif; font-size: 11pt; color: #1e293b; background: #fff; }
.page { max-width: 760px; margin: 0 auto; padding: 48px; }
/* Cover */
.cover { page-break-after: always; text-align: center; padding: 80px 0 60px; }
.cover-icon { font-size: 52px; margin-bottom: 20px; }
.cover-title { font-size: 30pt; font-weight: bold; color: #1d3557; }
.cover-sub { font-size: 16pt; color: #64748b; margin-top: 8px; }
.cover-date { font-size: 10pt; color: #94a3b8; margin-top: 36px; font-style: italic; }
.confidential { margin-top: 40px; padding: 16px 20px; border: 1.5px solid #fca5a5; border-radius: 8px; background: #fef2f2; font-size: 9.5pt; color: #991b1b; font-family: Arial, sans-serif; }
/* Sections */
.section { margin-top: 32px; page-break-inside: avoid; }
.section-hdr { display: flex; align-items: center; gap: 8px; border-bottom: 2.5px solid #1d3557; padding-bottom: 5px; margin-bottom: 14px; }
.section-emoji { font-size: 15pt; }
.section-title { font-size: 13pt; font-weight: bold; color: #1d3557; text-transform: uppercase; letter-spacing: 0.04em; }
.sub-hdr { font-size: 11pt; font-weight: bold; color: #475569; margin: 16px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
/* Member cards */
.member { margin-bottom: 16px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
.member-name { font-size: 12pt; font-weight: bold; color: #1e293b; margin-bottom: 6px; }
.badge { display: inline; font-size: 8pt; background: #fef3c7; color: #92400e; padding: 2px 7px; border-radius: 99px; font-weight: bold; }
.sub { font-size: 9pt; color: #64748b; font-weight: normal; font-style: italic; }
.bio { font-size: 10pt; color: #475569; line-height: 1.55; margin-bottom: 8px; }
.sub-section { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }
.sub-section h4 { font-size: 9pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; font-family: Arial, sans-serif; }
/* Fields */
.field { font-size: 10pt; margin-bottom: 3px; line-height: 1.5; }
.label { font-weight: bold; color: #475569; font-family: Arial, sans-serif; font-size: 9pt; }
.value { color: #1e293b; }
/* Cards */
.card { margin-bottom: 10px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
.card-name { font-size: 11pt; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
.preferred { display: inline; font-size: 8pt; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 99px; font-weight: bold; margin-left: 6px; }
.note { font-size: 9.5pt; color: #475569; margin-top: 4px; font-style: italic; line-height: 1.5; }
/* Rules / lists */
.rule { display: flex; gap: 10px; margin-bottom: 5px; font-size: 10pt; }
.rule-num { font-weight: bold; color: #64748b; min-width: 22px; }
/* Profile Q&A */
.qa { margin-bottom: 8px; }
.qa-q { font-size: 9.5pt; font-weight: bold; color: #475569; font-family: Arial, sans-serif; }
.qa-a { font-size: 10.5pt; color: #1e293b; line-height: 1.5; padding-left: 8px; border-left: 2px solid #e2e8f0; margin-top: 2px; }
/* Maintenance */
.maint-item { display: flex; gap: 10px; margin-bottom: 6px; font-size: 10pt; align-items: flex-start; }
.maint-cat { font-size: 8pt; background: #f1f5f9; color: #64748b; padding: 1px 6px; border-radius: 4px; white-space: nowrap; font-family: Arial, sans-serif; min-width: 90px; text-align: center; }
/* Training */
.video-item { margin-bottom: 8px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 5px; }
.video-title { font-weight: bold; font-size: 10.5pt; color: #1e293b; }
.video-url { font-size: 9pt; color: #3b82f6; }
/* Footer */
.footer { margin-top: 48px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8.5pt; color: #94a3b8; font-family: Arial, sans-serif; }
.empty { font-size: 10pt; color: #94a3b8; font-style: italic; }
@page { size: letter; margin: 0.8in; }
@media print { .cover { page-break-after: always; } }
</style></head><body><div class="page">

<!-- Cover -->
<div class="cover">
  <div class="cover-icon">🏡</div>
  <div class="cover-title">${householdName ? esc(householdName) : "Household"}</div>
  <div class="cover-sub">House Bible — Complete Household Reference</div>
  <div class="cover-date">Generated ${today}</div>
  <div class="confidential">⚠️ <strong>Confidential.</strong> This document contains personal information including medical details, passport numbers, and private contacts. Handle with care. Do not share outside the household.</div>
</div>

<!-- House Profile -->
${Object.keys(profileCategories).length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🏠</span><span class="section-title">House Profile</span></div>
  ${Object.entries(profileCategories).map(([cat, qs]) => `
    <div class="sub-hdr">${esc(cat)}</div>
    ${qs.map(q => `<div class="qa"><div class="qa-q">${esc(q.prompt)}</div><div class="qa-a">${esc(q.answer!.answer)}</div></div>`).join("")}
  `).join("")}
</div>` : ""}

<!-- Family Members -->
${people.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">👤</span><span class="section-title">Family Members</span></div>
  ${people.map(personBlock).join("")}
</div>` : ""}

<!-- Pets -->
${pets.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🐾</span><span class="section-title">Pets</span></div>
  ${pets.map(petBlock).join("")}
</div>` : ""}

<!-- House Rules -->
${rules.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">📋</span><span class="section-title">House Rules</span></div>
  ${rules.map((r, i) => `<div class="rule"><span class="rule-num">${i + 1}.</span><span>${esc(r.rule)}</span></div>`).join("")}
</div>` : ""}

<!-- Emergency Contacts -->
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🚨</span><span class="section-title">Emergency Contacts</span></div>
  ${contacts.length === 0 ? `<p class="empty">No emergency contacts on file.</p>` :
    contacts.map(c => `<div class="card"><div class="card-name">${esc(c.name)}${c.relationship ? ` <span class="sub">· ${esc(c.relationship)}</span>` : ""}</div>${pf("Phone", c.phone)}${pf("Email", c.email)}${c.notes ? `<p class="note">${esc(c.notes)}</p>` : ""}</div>`).join("")}
</div>

<!-- Health Insurance -->
${insurance.carrier || insurance.policyNumber ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🏥</span><span class="section-title">Health Insurance</span></div>
  <div class="card">
    ${pf("Carrier", insurance.carrier)}${pf("Policy #", insurance.policyNumber)}${pf("Group #", insurance.groupNumber)}${pf("Member Name", insurance.memberName)}${pf("Phone", insurance.phone)}${pf("Website", insurance.website)}
    ${insurance.notes ? `<p class="note">${esc(insurance.notes)}</p>` : ""}
  </div>
</div>` : ""}

<!-- Hospitals -->
${hospitals.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🏥</span><span class="section-title">Hospitals & Urgent Care</span></div>
  ${hospitals.map(h => `<div class="card"><div class="card-name">${esc(h.name)}${h.isPreferred ? `<span class="preferred">⭐ Preferred</span>` : ""}</div>${pf("Address", h.address)}${pf("Phone", h.phone)}${pf("Distance", h.distance)}${h.notes ? `<p class="note">${esc(h.notes)}</p>` : ""}</div>`).join("")}
</div>` : ""}

<!-- Vets -->
${vets.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🐾</span><span class="section-title">Emergency Vets</span></div>
  ${vets.map(v => `<div class="card"><div class="card-name">${esc(v.name)}${v.isPreferred ? `<span class="preferred">⭐ Preferred</span>` : ""}</div>${pf("Address", v.address)}${pf("Phone", v.phone)}${pf("Distance", v.distance)}${v.notes ? `<p class="note">${esc(v.notes)}</p>` : ""}</div>`).join("")}
</div>` : ""}

<!-- Workplace Contacts -->
${workplaceContacts.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">💼</span><span class="section-title">Workplace Contacts</span></div>
  ${workplaceContacts.map(w => `<div class="card"><div class="card-name">${esc(w.name)}${w.title ? ` <span class="sub">· ${esc(w.title)}</span>` : ""}</div>${w.employer ? pf("Employer", w.employer) : ""}${pf("Phone", w.phone)}${pf("Email", w.email)}${pf("Address", w.address)}${w.notes ? `<p class="note">${esc(w.notes)}</p>` : ""}</div>`).join("")}
</div>` : ""}

<!-- Vendors -->
${vendors.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🔨</span><span class="section-title">Vendors & Service Providers</span></div>
  ${vendors.map(v => `<div class="card"><div class="card-name">${esc(v.name)}${v.preferred ? `<span class="preferred">⭐ Preferred</span>` : ""}${v.type ? ` <span class="sub">· ${esc(v.type)}</span>` : ""}</div>${pf("Category", v.category)}${pf("Phone", v.phone)}${pf("Email", v.email)}${pf("Website", v.website)}${pf("Address", v.address)}${v.notes ? `<p class="note">${esc(v.notes)}</p>` : ""}</div>`).join("")}
</div>` : ""}

<!-- Maintenance -->
${(houseMaintenance.length > 0 || vehicles.length > 0) ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🔩</span><span class="section-title">Maintenance</span></div>
  ${houseMaintenance.length > 0 ? `
    <div class="sub-hdr">House Maintenance</div>
    ${houseMaintenance.map(item => `
      <div class="maint-item">
        <span class="maint-cat">${esc(item.category)}</span>
        <div>
          <strong>${esc(item.title)}</strong>
          ${item.lastDoneAt ? ` — Last done: ${fmtDate(item.lastDoneAt)}` : ""}
          ${item.nextDueAt ? ` · Next due: ${fmtDate(item.nextDueAt)}` : ""}
          ${item.notes ? `<br/><span style="font-size:9pt;color:#64748b;">${esc(item.notes)}</span>` : ""}
        </div>
      </div>`).join("")}` : ""}
  ${vehicles.map(v => {
    const vItems = maintenance.filter(m => m.vehicleId === v.id);
    return `
      <div class="sub-hdr">${esc(v.name)}${v.year ? ` (${esc(v.year)})` : ""}${v.color ? ` — ${esc(v.color)}` : ""}${v.licensePlate ? ` · Plate: ${esc(v.licensePlate)}` : ""}</div>
      ${vItems.map(item => `
        <div class="maint-item">
          <span class="maint-cat">${esc(item.category)}</span>
          <div>
            <strong>${esc(item.title)}</strong>
            ${item.lastDoneAt ? ` — Last done: ${fmtDate(item.lastDoneAt)}` : ""}
            ${item.nextDueAt ? ` · Next due: ${fmtDate(item.nextDueAt)}` : ""}
            ${item.notes ? `<br/><span style="font-size:9pt;color:#64748b;">${esc(item.notes)}</span>` : ""}
          </div>
        </div>`).join("")}`;
  }).join("")}
</div>` : ""}

<!-- Training Videos -->
${training.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🎓</span><span class="section-title">Training Videos</span></div>
  ${training.map(v => `
    <div class="video-item">
      <div class="video-title">${esc(v.title)}</div>
      ${v.description ? `<p style="font-size:9.5pt;color:#475569;margin-top:2px;">${esc(v.description)}</p>` : ""}
      <div class="video-url">▶ ${esc(v.url)}</div>
    </div>`).join("")}
</div>` : ""}

<!-- SOPs -->
${sops.length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">📖</span><span class="section-title">Standard Operating Procedures</span></div>
  ${sops.map(s => `
    <div class="card">
      <div class="card-name">${esc(s.name)}</div>
      ${s.notes ? `<p class="note">${esc(s.notes)}</p>` : ""}
    </div>`).join("")}
</div>` : ""}

<div class="footer">The House Ledger · House Bible · Generated ${today} · Confidential — For Household Use Only</div>
</div></body></html>`;
  }

  function handlePrint() {
    setPrintLoading(true);
    try {
      const win = window.open("", "_blank", "width=900,height=720");
      if (!win) { alert("Please allow popups to generate the PDF."); setPrintLoading(false); return; }
      win.document.write(buildPrintHTML());
      win.document.close();
      win.onload = () => { setTimeout(() => { win.print(); setPrintLoading(false); }, 400); };
    } catch { setPrintLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <p className="text-sm text-slate-400 py-12 text-center">Assembling House Bible…</p>;

  const counts = {
    profile: answeredProfile.length,
    people: people.length,
    pets: pets.length,
    rules: rules.length,
    emergency: contacts.length,
    insurance: (insurance.carrier || insurance.policyNumber) ? 1 : 0,
    hospitals: hospitals.length,
    vets: vets.length,
    workplace: workplaceContacts.length,
    vendors: vendors.length,
    maintenance: maintenance.length,
    training: training.length,
    sops: sops.length,
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">📖 House Bible</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-lg">
            A complete household reference document — family profiles, emergency info, vendors, maintenance, training, and SOPs. Ready to print as a booklet.
          </p>
          <div className="mt-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-lg">
            ⚠️ <strong>Includes personal data</strong> (medical, passport, private contacts). Only share with trusted household staff.
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={printLoading}
          className="btn-primary text-sm px-5 py-2.5 shrink-0 flex items-center gap-2 disabled:opacity-60"
        >
          {printLoading
            ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
            : <>🖨️ Print / Save as PDF</>}
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
        {[
          { icon: "🏠", label: "Profile Answers", n: counts.profile },
          { icon: "👤", label: "People", n: counts.people },
          { icon: "🐾", label: "Pets", n: counts.pets },
          { icon: "📋", label: "House Rules", n: counts.rules },
          { icon: "🚨", label: "Emergency Contacts", n: counts.emergency },
          { icon: "🏥", label: "Facilities", n: counts.hospitals + counts.vets },
          { icon: "💼", label: "Workplace", n: counts.workplace },
          { icon: "🔨", label: "Vendors", n: counts.vendors },
          { icon: "🔩", label: "Maintenance", n: counts.maintenance },
          { icon: "🎓", label: "Training", n: counts.training },
          { icon: "📖", label: "SOPs", n: counts.sops },
          { icon: "📄", label: "Total Sections", n: Object.values(counts).filter(Boolean).length },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <span className="text-lg shrink-0">{s.icon}</span>
            <div>
              <p className="text-base font-bold text-slate-900 leading-none">{s.n}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Preview document */}
      <div className="card overflow-hidden">
        {/* Document header bar */}
        <div className="px-5 py-4 bg-brand-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏡</span>
            <span className="font-bold">{householdName ?? "Household"} — House Bible</span>
          </div>
          <span className="text-xs text-white/50">Preview · {today}</span>
        </div>

        <div className="divide-y divide-slate-100 text-sm">
          <PreviewSection emoji="🏠" title="House Profile" count={counts.profile}>
            {answeredProfile.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No profile answers on file</p>
              : Object.entries(
                  answeredProfile.reduce((acc, q) => { (acc[q.category] = acc[q.category] || []).push(q); return acc; }, {} as Record<string, ProfileQuestion[]>)
                ).map(([cat, qs]) => (
                  <div key={cat} className="mt-2 first:mt-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{cat}</p>
                    {qs.map(q => (
                      <div key={q.id} className="mb-1.5">
                        <p className="text-xs text-slate-500 font-medium">{q.prompt}</p>
                        <p className="text-sm text-slate-800 ml-2 line-clamp-1">{q.answer!.answer}</p>
                      </div>
                    ))}
                  </div>
                ))}
          </PreviewSection>

          <PreviewSection emoji="👤" title="Family Members" count={counts.people}>
            {people.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No family members on file</p>
              : people.map(m => (
                <div key={m.id} className="py-1 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{m.name}</span>
                  {m.birthdate && <span className="text-xs text-slate-400 ml-2">🎂 {m.birthdate}</span>}
                  {m.allergies && <span className="text-xs text-amber-600 ml-2">⚠️ Allergies</span>}
                  {m.passportNumber && <span className="text-xs text-slate-400 ml-2">🛂 Passport</span>}
                  {m.tsaPrecheck && <span className="text-xs text-slate-400 ml-2">✈️ TSA</span>}
                </div>
              ))}
          </PreviewSection>

          <PreviewSection emoji="🐾" title="Pets" count={counts.pets}>
            {pets.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No pets on file</p>
              : pets.map(m => (
                <div key={m.id} className="py-1 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{m.name}</span>
                  {m.petType && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2">{m.petType}</span>}
                  {m.breed && <span className="text-xs text-slate-400 ml-2">{m.breed}</span>}
                </div>
              ))}
          </PreviewSection>

          <PreviewSection emoji="📋" title="House Rules" count={counts.rules}>
            {rules.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No rules on file</p>
              : rules.map((r, i) => <p key={r.id} className="text-sm text-slate-700 py-0.5"><span className="text-slate-400 font-semibold mr-2">{i + 1}.</span>{r.rule}</p>)}
          </PreviewSection>

          <PreviewSection emoji="🚨" title="Emergency Contacts" count={counts.emergency}>
            {contacts.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No contacts on file</p>
              : contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-0.5">
                  <span className="font-medium text-slate-800 min-w-[130px]">{c.name}</span>
                  {c.relationship && <span className="text-xs text-slate-500">{c.relationship}</span>}
                  {c.phone && <span className="text-xs text-brand-600">{c.phone}</span>}
                </div>
              ))}
          </PreviewSection>

          {(insurance.carrier || insurance.policyNumber) && (
            <PreviewSection emoji="🏥" title="Health Insurance" count={1}>
              {insurance.carrier && <BibleField label="Carrier" value={insurance.carrier} />}
              {insurance.policyNumber && <BibleField label="Policy #" value={insurance.policyNumber} />}
            </PreviewSection>
          )}

          {(hospitals.length > 0 || vets.length > 0) && (
            <PreviewSection emoji="🏨" title="Emergency Facilities" count={hospitals.length + vets.length}>
              {[...hospitals, ...vets].map(f => (
                <div key={f.id} className="flex items-center gap-2 py-0.5">
                  <span className="font-medium text-slate-800 min-w-[150px]">{f.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{f.type === "HOSPITAL" ? "Hospital" : "Vet"}</span>
                  {f.phone && <span className="text-xs text-brand-600">{f.phone}</span>}
                  {f.isPreferred && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">⭐</span>}
                </div>
              ))}
            </PreviewSection>
          )}

          {workplaceContacts.length > 0 && (
            <PreviewSection emoji="💼" title="Workplace Contacts" count={counts.workplace}>
              {workplaceContacts.map(w => (
                <div key={w.id} className="flex items-center gap-2 py-0.5">
                  <span className="font-medium text-slate-800 min-w-[130px]">{w.name}</span>
                  {w.employer && <span className="text-xs text-slate-500">{w.employer}</span>}
                  {w.phone && <span className="text-xs text-brand-600">{w.phone}</span>}
                </div>
              ))}
            </PreviewSection>
          )}

          <PreviewSection emoji="🔨" title="Vendors & Service Providers" count={counts.vendors}>
            {vendors.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No vendors on file</p>
              : vendors.map(v => (
                <div key={v.id} className="flex items-center gap-2 py-0.5">
                  <span className="font-medium text-slate-800 min-w-[150px]">{v.name}</span>
                  {v.type && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{v.type}</span>}
                  {v.phone && <span className="text-xs text-brand-600">{v.phone}</span>}
                  {v.preferred && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">⭐</span>}
                </div>
              ))}
          </PreviewSection>

          <PreviewSection emoji="🔩" title="Maintenance" count={counts.maintenance}>
            {maintenance.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No maintenance items on file</p>
              : maintenance.slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{m.category}</span>
                  <span className="text-sm text-slate-800">{m.title}</span>
                  {m.nextDueAt && <span className="text-xs text-amber-600 ml-auto">Due {fmtDate(m.nextDueAt)}</span>}
                </div>
              ))}
            {maintenance.length > 8 && <p className="text-xs text-slate-400 italic">+{maintenance.length - 8} more items in document</p>}
          </PreviewSection>

          <PreviewSection emoji="🎓" title="Training Videos" count={counts.training}>
            {training.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No training videos on file</p>
              : training.map(v => (
                <div key={v.id} className="py-0.5">
                  <span className="font-medium text-slate-800">{v.title}</span>
                  {v.description && <span className="text-xs text-slate-500 ml-2">— {v.description}</span>}
                </div>
              ))}
          </PreviewSection>

          <PreviewSection emoji="📖" title="Standard Operating Procedures" count={counts.sops}>
            {sops.length === 0 ? <p className="text-xs text-slate-400 italic py-1">No SOPs on file</p>
              : sops.map(s => (
                <div key={s.id} className="flex items-center gap-2 py-0.5">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  {s.photos.length > 0 && <span className="text-xs text-slate-400">{s.photos.length} photo{s.photos.length !== 1 ? "s" : ""}</span>}
                </div>
              ))}
          </PreviewSection>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Click <strong>"Print / Save as PDF"</strong> above → choose <strong>"Save as PDF"</strong> in your print settings for a clean booklet.
          </p>
        </div>
      </div>
    </div>
  );
}
