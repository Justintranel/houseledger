"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface EmergencyContact { id: string; name: string; relationship: string | null; phone: string | null; email: string | null; notes: string | null; }
interface WorkplaceContact { id: string; name: string; employer: string | null; title: string | null; phone: string | null; email: string | null; address: string | null; notes: string | null; }
interface EmergencyFacility { id: string; type: "HOSPITAL" | "VET"; name: string; address: string | null; phone: string | null; distance: string | null; notes: string | null; isPreferred: boolean; }
interface EmergencyInsurance { carrier: string | null; policyNumber: string | null; groupNumber: string | null; memberName: string | null; phone: string | null; website: string | null; notes: string | null; }

interface FamilyMember {
  id: string; type: "PERSON" | "PET"; name: string; petType: string | null; breed: string | null;
  bio: string | null; birthdate: string | null; height: string | null; weight: string | null;
  bloodType: string | null; allergies: string | null; medications: string | null;
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

function PreviewSection({ emoji, title, count, children }: { emoji: string; title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{emoji}</span>
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${count > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>{count}</span>
        </div>
        <span className="text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-5 pb-4 space-y-1 bg-slate-50 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Source guide ─────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  { emoji: "🏠", label: "House Profile",    href: "/dashboard/profile",   description: "Property details, layout, preferences, and household info" },
  { emoji: "👨‍👩‍👧‍👦", label: "Family Bio",        href: "/dashboard/family",    description: "People & pets — medical, school, travel, and daily details" },
  { emoji: "🚨", label: "Emergency Info",   href: "/dashboard/emergency", description: "Emergency contacts, hospitals, insurance, workplace contacts" },
  { emoji: "🔨", label: "Vendors",          href: "/dashboard/vendors",   description: "Service providers, contractors, and preferred vendors" },
  { emoji: "🔩", label: "Maintenance",      href: "/dashboard/maintenance", description: "House and vehicle maintenance schedules and history" },
  { emoji: "🎓", label: "Training Videos",  href: "/dashboard/training",  description: "Video guides and procedures for your house manager" },
  { emoji: "📖", label: "House SOPs",       href: "/dashboard/sop",       description: "Room-by-room standard operating procedures" },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function HouseBible() {
  // Emergency data
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [workplaceContacts, setWorkplaceContacts] = useState<WorkplaceContact[]>([]);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [insurance, setInsurance] = useState<EmergencyInsurance | null>(null);
  // Other data
  const [profile, setProfile] = useState<ProfileQuestion[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [training, setTraining] = useState<TrainingVideo[]>([]);
  const [householdName, setHouseholdName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        pRes, mRes, rRes, vRes, sRes, veRes, mainRes, tRes,
        ecRes, wcRes, fRes, iRes, hRes,
      ] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/family"),
        fetch("/api/house-rules"),
        fetch("/api/vendors"),
        fetch("/api/sop"),
        fetch("/api/vehicles"),
        fetch("/api/maintenance"),
        fetch("/api/training"),
        fetch("/api/emergency/contacts"),
        fetch("/api/emergency/workplace"),
        fetch("/api/emergency/facilities"),
        fetch("/api/emergency/insurance"),
        fetch("/api/household"),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (mRes.ok) setMembers(await mRes.json());
      if (rRes.ok) setRules(await rRes.json());
      if (vRes.ok) setVendors(await vRes.json());
      if (sRes.ok) setSops(await sRes.json());
      if (veRes.ok) setVehicles(await veRes.json());
      if (mainRes.ok) setMaintenance(await mainRes.json());
      if (tRes.ok) setTraining(await tRes.json());
      if (ecRes.ok) setContacts(await ecRes.json());
      if (wcRes.ok) setWorkplaceContacts(await wcRes.json());
      if (fRes.ok) setFacilities(await fRes.json());
      if (iRes.ok) { const d = await iRes.json(); if (d) setInsurance(d); }
      if (hRes.ok) { const d = await hRes.json(); if (d?.name) setHouseholdName(d.name); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const people = members.filter(m => m.type === "PERSON");
  const pets   = members.filter(m => m.type === "PET");
  const hospitals = facilities.filter(f => f.type === "HOSPITAL");
  const vets      = facilities.filter(f => f.type === "VET");
  const answeredProfile = profile.filter(q => q.answer?.answer);
  const houseMaintenance = maintenance.filter(m => !m.vehicleId);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Print HTML ─────────────────────────────────────────────────────────────

  function buildPrintHTML(): string {
    const profileCategories: Record<string, ProfileQuestion[]> = {};
    for (const q of answeredProfile) {
      (profileCategories[q.category] = profileCategories[q.category] || []).push(q);
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
.cover { page-break-after: always; text-align: center; padding: 80px 0 60px; }
.cover-icon { font-size: 52px; margin-bottom: 20px; }
.cover-title { font-size: 30pt; font-weight: bold; color: #1d3557; }
.cover-sub { font-size: 16pt; color: #64748b; margin-top: 8px; }
.cover-date { font-size: 10pt; color: #94a3b8; margin-top: 36px; font-style: italic; }
.confidential { margin-top: 40px; padding: 16px 20px; border: 1.5px solid #fca5a5; border-radius: 8px; background: #fef2f2; font-size: 9.5pt; color: #991b1b; font-family: Arial, sans-serif; }
.section { margin-top: 32px; page-break-inside: avoid; }
.section-hdr { display: flex; align-items: center; gap: 8px; border-bottom: 2.5px solid #1d3557; padding-bottom: 5px; margin-bottom: 14px; }
.section-emoji { font-size: 15pt; }
.section-title { font-size: 13pt; font-weight: bold; color: #1d3557; text-transform: uppercase; letter-spacing: 0.04em; }
.sub-hdr { font-size: 11pt; font-weight: bold; color: #475569; margin: 16px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
.member { margin-bottom: 16px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
.member-name { font-size: 12pt; font-weight: bold; color: #1e293b; margin-bottom: 6px; }
.badge { display: inline; font-size: 8pt; background: #fef3c7; color: #92400e; padding: 2px 7px; border-radius: 99px; font-weight: bold; }
.sub { font-size: 9pt; color: #64748b; font-weight: normal; font-style: italic; }
.bio { font-size: 10pt; color: #475569; line-height: 1.55; margin-bottom: 8px; }
.sub-section { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }
.sub-section h4 { font-size: 9pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; font-family: Arial, sans-serif; }
.field { font-size: 10pt; margin-bottom: 3px; line-height: 1.5; }
.label { font-weight: bold; color: #475569; font-family: Arial, sans-serif; font-size: 9pt; }
.value { color: #1e293b; }
.card { margin-bottom: 10px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
.card-name { font-size: 11pt; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
.preferred { display: inline; font-size: 8pt; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 99px; font-weight: bold; margin-left: 6px; }
.note { font-size: 9.5pt; color: #475569; margin-top: 4px; font-style: italic; line-height: 1.5; }
.rule { display: flex; gap: 10px; margin-bottom: 5px; font-size: 10pt; }
.rule-num { font-weight: bold; color: #64748b; min-width: 22px; }
.qa { margin-bottom: 8px; }
.qa-q { font-size: 9.5pt; font-weight: bold; color: #475569; font-family: Arial, sans-serif; }
.qa-a { font-size: 10.5pt; color: #1e293b; line-height: 1.5; padding-left: 8px; border-left: 2px solid #e2e8f0; margin-top: 2px; }
.maint-item { display: flex; gap: 10px; margin-bottom: 6px; font-size: 10pt; align-items: flex-start; }
.maint-cat { font-size: 8pt; background: #f1f5f9; color: #64748b; padding: 1px 6px; border-radius: 4px; white-space: nowrap; font-family: Arial, sans-serif; min-width: 90px; text-align: center; }
.video-item { margin-bottom: 8px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 5px; }
.video-title { font-weight: bold; font-size: 10.5pt; color: #1e293b; }
.video-url { font-size: 9pt; color: #3b82f6; }
.empty { font-size: 10pt; color: #94a3b8; font-style: italic; }
.footer { margin-top: 48px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8.5pt; color: #94a3b8; font-family: Arial, sans-serif; }
@page { size: letter; margin: 0.8in; }
@media print { .cover { page-break-after: always; } }
</style></head><body><div class="page">

<div class="cover">
  <div class="cover-icon">🏡</div>
  <div class="cover-title">${householdName ? esc(householdName) : "Household"}</div>
  <div class="cover-sub">House Bible — Complete Household Reference</div>
  <div class="cover-date">Generated ${today}</div>
  <div class="confidential">⚠️ <strong>Confidential.</strong> This document contains personal information including medical details, passport numbers, and private contacts. Handle with care and do not share outside the household.<br/><br/>🕐 <strong>Data Currency Notice:</strong> This document is only as accurate as the most recent updates made to The House Ledger. Information may have changed since this was printed. Always request a fresh copy when household details are updated.</div>
</div>

${Object.keys(profileCategories).length > 0 ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🏠</span><span class="section-title">House Profile</span></div>
  ${Object.entries(profileCategories).map(([cat, qs]) => `<div class="sub-hdr">${esc(cat)}</div>${qs.map(q => `<div class="qa"><div class="qa-q">${esc(q.prompt)}</div><div class="qa-a">${esc(q.answer!.answer)}</div></div>`).join("")}`).join("")}
</div>` : ""}

${people.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">👤</span><span class="section-title">Family Members</span></div>${people.map(personBlock).join("")}</div>` : ""}
${pets.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🐾</span><span class="section-title">Pets</span></div>${pets.map(petBlock).join("")}</div>` : ""}

${rules.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">📋</span><span class="section-title">House Rules</span></div>${rules.map((r, i) => `<div class="rule"><span class="rule-num">${i + 1}.</span><span>${esc(r.rule)}</span></div>`).join("")}</div>` : ""}

<div class="section">
  <div class="section-hdr"><span class="section-emoji">🚨</span><span class="section-title">Emergency Contacts</span></div>
  ${contacts.length === 0 ? `<p class="empty">No emergency contacts on file.</p>` : contacts.map(c => `<div class="card"><div class="card-name">${esc(c.name)}${c.relationship ? ` <span class="sub">· ${esc(c.relationship)}</span>` : ""}</div>${pf("Phone", c.phone)}${pf("Email", c.email)}${c.notes ? `<p class="note">${esc(c.notes)}</p>` : ""}</div>`).join("")}
</div>

${insurance && (insurance.carrier || insurance.policyNumber) ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🏥</span><span class="section-title">Health Insurance</span></div><div class="card">${pf("Carrier", insurance.carrier)}${pf("Policy #", insurance.policyNumber)}${pf("Group #", insurance.groupNumber)}${pf("Member Name", insurance.memberName)}${pf("Phone", insurance.phone)}${pf("Website", insurance.website)}${insurance.notes ? `<p class="note">${esc(insurance.notes)}</p>` : ""}</div></div>` : ""}

${hospitals.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🏥</span><span class="section-title">Hospitals & Urgent Care</span></div>${hospitals.map(h => `<div class="card"><div class="card-name">${esc(h.name)}${h.isPreferred ? `<span class="preferred">⭐ Preferred</span>` : ""}</div>${pf("Address", h.address)}${pf("Phone", h.phone)}${pf("Distance", h.distance)}${h.notes ? `<p class="note">${esc(h.notes)}</p>` : ""}</div>`).join("")}</div>` : ""}
${vets.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🐾</span><span class="section-title">Emergency Vets</span></div>${vets.map(v => `<div class="card"><div class="card-name">${esc(v.name)}${v.isPreferred ? `<span class="preferred">⭐ Preferred</span>` : ""}</div>${pf("Address", v.address)}${pf("Phone", v.phone)}${pf("Distance", v.distance)}${v.notes ? `<p class="note">${esc(v.notes)}</p>` : ""}</div>`).join("")}</div>` : ""}
${workplaceContacts.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">💼</span><span class="section-title">Workplace Contacts</span></div>${workplaceContacts.map(w => `<div class="card"><div class="card-name">${esc(w.name)}${w.title ? ` <span class="sub">· ${esc(w.title)}</span>` : ""}</div>${w.employer ? pf("Employer", w.employer) : ""}${pf("Phone", w.phone)}${pf("Email", w.email)}${pf("Address", w.address)}${w.notes ? `<p class="note">${esc(w.notes)}</p>` : ""}</div>`).join("")}</div>` : ""}

${vendors.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🔨</span><span class="section-title">Vendors & Service Providers</span></div>${vendors.map(v => `<div class="card"><div class="card-name">${esc(v.name)}${v.preferred ? `<span class="preferred">⭐ Preferred</span>` : ""}${v.type ? ` <span class="sub">· ${esc(v.type)}</span>` : ""}</div>${pf("Category", v.category)}${pf("Phone", v.phone)}${pf("Email", v.email)}${pf("Website", v.website)}${pf("Address", v.address)}${v.notes ? `<p class="note">${esc(v.notes)}</p>` : ""}</div>`).join("")}</div>` : ""}

${(houseMaintenance.length > 0 || vehicles.length > 0) ? `
<div class="section">
  <div class="section-hdr"><span class="section-emoji">🔩</span><span class="section-title">Maintenance</span></div>
  ${houseMaintenance.length > 0 ? `<div class="sub-hdr">House Maintenance</div>${houseMaintenance.map(item => `<div class="maint-item"><span class="maint-cat">${esc(item.category)}</span><div><strong>${esc(item.title)}</strong>${item.lastDoneAt ? ` — Last done: ${fmtDate(item.lastDoneAt)}` : ""}${item.nextDueAt ? ` · Next due: ${fmtDate(item.nextDueAt)}` : ""}${item.notes ? `<br/><span style="font-size:9pt;color:#64748b;">${esc(item.notes)}</span>` : ""}</div></div>`).join("")}` : ""}
  ${vehicles.map(v => { const vi = maintenance.filter(m => m.vehicleId === v.id); return `<div class="sub-hdr">${esc(v.name)}${v.year ? ` (${esc(v.year)})` : ""}${v.color ? ` — ${esc(v.color)}` : ""}${v.licensePlate ? ` · Plate: ${esc(v.licensePlate)}` : ""}</div>${vi.map(item => `<div class="maint-item"><span class="maint-cat">${esc(item.category)}</span><div><strong>${esc(item.title)}</strong>${item.lastDoneAt ? ` — Last done: ${fmtDate(item.lastDoneAt)}` : ""}${item.nextDueAt ? ` · Next due: ${fmtDate(item.nextDueAt)}` : ""}${item.notes ? `<br/><span style="font-size:9pt;color:#64748b;">${esc(item.notes)}</span>` : ""}</div></div>`).join("")}`; }).join("")}
</div>` : ""}

${training.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">🎓</span><span class="section-title">Training Videos</span></div>${training.map(v => `<div class="video-item"><div class="video-title">${esc(v.title)}</div>${v.description ? `<p style="font-size:9.5pt;color:#475569;margin-top:2px;">${esc(v.description)}</p>` : ""}<div class="video-url">▶ ${esc(v.url)}</div></div>`).join("")}</div>` : ""}

${sops.length > 0 ? `<div class="section"><div class="section-hdr"><span class="section-emoji">📖</span><span class="section-title">Standard Operating Procedures</span></div>${sops.map(s => `<div class="card"><div class="card-name">${esc(s.name)}</div>${s.notes ? `<p class="note">${esc(s.notes)}</p>` : ""}</div>`).join("")}</div>` : ""}

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

  const counts = {
    profile: answeredProfile.length,
    people: people.length,
    pets: pets.length,
    rules: rules.length,
    emergency: contacts.length,
    hospitals: hospitals.length + vets.length,
    insurance: insurance && (insurance.carrier || insurance.policyNumber) ? 1 : 0,
    workplace: workplaceContacts.length,
    vendors: vendors.length,
    maintenance: maintenance.length,
    training: training.length,
    sops: sops.length,
  };

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">📖 House Bible</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Your complete household reference guide — automatically assembled from everything you've entered across The House Ledger.
              Print it once and hand it to your house manager on day one.
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={printLoading || loading}
            className="btn-primary text-sm px-5 py-2.5 shrink-0 flex items-center gap-2 disabled:opacity-60"
          >
            {printLoading
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              : <>🖨️ Print / Save as PDF</>}
          </button>
        </div>

        {/* Confidential warning */}
        <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-2xl">
          <span className="text-base shrink-0 mt-0.5">⚠️</span>
          <div className="space-y-1">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>This document includes personal data</strong> — medical details, passport numbers, allergies, medications, and private contacts.
              Only share with trusted household staff. The printed PDF includes a confidentiality notice.
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              🕐 <strong>This document is only as current as your last update.</strong> The information shown reflects whatever was most recently entered into each section of The House Ledger. Always reprint after making changes to keep your manager's copy up to date.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800">How the House Bible works</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            This document is automatically built from the information you enter in other sections of The House Ledger.
            The more complete those sections are, the more useful your House Bible will be.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pulls from these sections</p>
            {DATA_SOURCES.map(src => (
              <div key={src.href} className="flex items-start gap-3">
                <span className="text-base shrink-0">{src.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{src.label}</p>
                  <p className="text-xs text-slate-500">{src.description}</p>
                </div>
                <Link
                  href={src.href}
                  className="text-xs text-brand-600 hover:underline shrink-0 font-medium"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">How to use it</p>
            <ol className="space-y-3">
              {[
                { n: "1", title: "Fill in your sections", body: "Go through each section linked to the left and enter your household's information. The House Bible updates in real-time." },
                { n: "2", title: 'Click "Print / Save as PDF"', body: 'A new window opens with a professionally formatted document. In your browser\'s print dialog, choose "Save as PDF."' },
                { n: "3", title: "Hand it to your manager", body: "Print it out or share the PDF on day one. Your manager will have everything they need to run the household." },
                { n: "4", title: "Reprint when things change", body: "Come back anytime and regenerate — it always reflects the latest data in the system." },
              ].map(step => (
                <li key={step.n} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Content preview */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Assembling your House Bible…</p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {[
              { icon: "🏠", label: "Profile Answers", n: counts.profile },
              { icon: "👤", label: "People",          n: counts.people },
              { icon: "🐾", label: "Pets",            n: counts.pets },
              { icon: "📋", label: "House Rules",     n: counts.rules },
              { icon: "🚨", label: "Emergency Contacts", n: counts.emergency },
              { icon: "🏥", label: "Facilities",      n: counts.hospitals },
              { icon: "💼", label: "Workplace",       n: counts.workplace },
              { icon: "🔨", label: "Vendors",         n: counts.vendors },
              { icon: "🔩", label: "Maintenance",     n: counts.maintenance },
              { icon: "🎓", label: "Training Videos", n: counts.training },
              { icon: "📖", label: "SOPs",            n: counts.sops },
              { icon: "📄", label: "Total Items",     n: totalItems },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl px-3 py-2.5 flex items-center gap-2.5 ${s.n > 0 ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-lg shrink-0">{s.icon}</span>
                <div>
                  <p className={`text-base font-bold leading-none ${s.n > 0 ? "text-green-800" : "text-slate-400"}`}>{s.n}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Document preview */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 bg-brand-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏡</span>
                <span className="font-bold">{householdName || "Your Household"} — House Bible</span>
              </div>
              <span className="text-xs text-white/50">Preview · {today}</span>
            </div>

            <div className="divide-y divide-slate-100 text-sm">

              <PreviewSection emoji="🏠" title="House Profile" count={counts.profile}>
                {answeredProfile.length === 0
                  ? <EmptyHint href="/dashboard/profile" label="Go to House Profile →" />
                  : Object.entries(answeredProfile.reduce((acc, q) => { (acc[q.category] = acc[q.category] || []).push(q); return acc; }, {} as Record<string, ProfileQuestion[]>))
                      .map(([cat, qs]) => (
                        <div key={cat} className="mt-2 first:mt-0">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{cat}</p>
                          {qs.map(q => <div key={q.id} className="mb-1"><p className="text-xs text-slate-500">{q.prompt}</p><p className="text-sm text-slate-800 ml-2 line-clamp-1">{q.answer!.answer}</p></div>)}
                        </div>
                      ))}
              </PreviewSection>

              <PreviewSection emoji="👤" title="Family Members" count={counts.people}>
                {people.length === 0
                  ? <EmptyHint href="/dashboard/family" label="Go to Family Bio →" />
                  : people.map(m => (
                    <div key={m.id} className="py-1 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      {m.birthdate && <span className="text-xs text-slate-400 ml-2">🎂 {m.birthdate}</span>}
                      {m.allergies && <span className="text-xs text-amber-600 ml-2">⚠️ Allergies</span>}
                      {m.passportNumber && <span className="text-xs text-slate-400 ml-2">🛂 Passport</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="🐾" title="Pets" count={counts.pets}>
                {pets.length === 0
                  ? <EmptyHint href="/dashboard/family" label="Go to Family Bio →" />
                  : pets.map(m => (
                    <div key={m.id} className="py-1 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      {m.petType && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2">{m.petType}</span>}
                      {m.breed && <span className="text-xs text-slate-400 ml-2">{m.breed}</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="📋" title="House Rules" count={counts.rules}>
                {rules.length === 0
                  ? <EmptyHint href="/dashboard/family" label="Go to Family Bio → House Rules →" />
                  : rules.map((r, i) => <p key={r.id} className="text-sm text-slate-700 py-0.5"><span className="text-slate-400 font-semibold mr-2">{i + 1}.</span>{r.rule}</p>)}
              </PreviewSection>

              <PreviewSection emoji="🚨" title="Emergency Contacts" count={counts.emergency}>
                {contacts.length === 0
                  ? <EmptyHint href="/dashboard/emergency" label="Go to Emergency Info →" />
                  : contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-0.5">
                      <span className="font-medium text-slate-800 min-w-[130px]">{c.name}</span>
                      {c.relationship && <span className="text-xs text-slate-500">{c.relationship}</span>}
                      {c.phone && <span className="text-xs text-brand-600">{c.phone}</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="🏥" title="Hospitals & Emergency Vets" count={counts.hospitals}>
                {hospitals.length + vets.length === 0
                  ? <EmptyHint href="/dashboard/emergency" label="Go to Emergency Info →" />
                  : [...hospitals, ...vets].map(f => (
                    <div key={f.id} className="flex items-center gap-2 py-0.5">
                      <span className="font-medium text-slate-800 min-w-[150px]">{f.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{f.type === "HOSPITAL" ? "Hospital" : "Vet"}</span>
                      {f.phone && <span className="text-xs text-brand-600">{f.phone}</span>}
                      {f.isPreferred && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">⭐</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="💼" title="Workplace Contacts" count={counts.workplace}>
                {workplaceContacts.length === 0
                  ? <EmptyHint href="/dashboard/emergency" label="Go to Emergency Info → Workplace Contacts →" />
                  : workplaceContacts.map(w => (
                    <div key={w.id} className="flex items-center gap-2 py-0.5">
                      <span className="font-medium text-slate-800 min-w-[130px]">{w.name}</span>
                      {w.employer && <span className="text-xs text-slate-500">{w.employer}</span>}
                      {w.phone && <span className="text-xs text-brand-600">{w.phone}</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="🔨" title="Vendors & Service Providers" count={counts.vendors}>
                {vendors.length === 0
                  ? <EmptyHint href="/dashboard/vendors" label="Go to Vendors →" />
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
                {maintenance.length === 0
                  ? <EmptyHint href="/dashboard/maintenance" label="Go to Maintenance →" />
                  : maintenance.slice(0, 8).map(m => (
                    <div key={m.id} className="flex items-center gap-2 py-0.5">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{m.category}</span>
                      <span className="text-sm text-slate-800">{m.title}</span>
                      {m.nextDueAt && <span className="text-xs text-amber-600 ml-auto">Due {fmtDate(m.nextDueAt)}</span>}
                    </div>
                  ))}
                {maintenance.length > 8 && <p className="text-xs text-slate-400 italic">+{maintenance.length - 8} more items in printed document</p>}
              </PreviewSection>

              <PreviewSection emoji="🎓" title="Training Videos" count={counts.training}>
                {training.length === 0
                  ? <EmptyHint href="/dashboard/training" label="Go to Training Videos →" />
                  : training.map(v => (
                    <div key={v.id} className="py-0.5">
                      <span className="font-medium text-slate-800">{v.title}</span>
                      {v.description && <span className="text-xs text-slate-500 ml-2">— {v.description}</span>}
                    </div>
                  ))}
              </PreviewSection>

              <PreviewSection emoji="📖" title="Standard Operating Procedures" count={counts.sops}>
                {sops.length === 0
                  ? <EmptyHint href="/dashboard/sop" label="Go to House SOPs →" />
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
                Click <strong>"Print / Save as PDF"</strong> above → in the print dialog, choose <strong>"Save as PDF"</strong> to download a clean booklet.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyHint({ href, label }: { href: string; label: string }) {
  return (
    <div className="py-1 flex items-center gap-2">
      <span className="text-xs text-slate-400 italic">Nothing on file yet.</span>
      <Link href={href} className="text-xs text-brand-600 hover:underline font-medium">{label}</Link>
    </div>
  );
}
