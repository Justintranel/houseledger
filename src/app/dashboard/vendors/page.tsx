"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  license: string | null;
  type: string | null;
  category: string | null;
  notes: string | null;
  approvalLimit: number | null;
  preferred: boolean;
  createdAt: string;
}

// ── Categories & types ────────────────────────────────────────────────────────

const CATEGORIES: { id: string; label: string; icon: string; color: string }[] = [
  { id: "Maintenance & Repairs",  label: "Maintenance & Repairs",  icon: "🔧", color: "bg-blue-100 text-blue-800" },
  { id: "Outdoor & Property",     label: "Outdoor & Property",     icon: "🌿", color: "bg-green-100 text-green-800" },
  { id: "Cleaning Services",      label: "Cleaning Services",      icon: "🧹", color: "bg-cyan-100 text-cyan-800" },
  { id: "Security & Safety",      label: "Security & Safety",      icon: "🔒", color: "bg-yellow-100 text-yellow-800" },
  { id: "Design & Lifestyle",     label: "Design & Lifestyle",     icon: "🎨", color: "bg-purple-100 text-purple-800" },
  { id: "Technology",             label: "Technology",             icon: "📱", color: "bg-slate-100 text-slate-700" },
];

const VENDOR_TYPES: { type: string; category: string; icon: string }[] = [
  // Maintenance & Repairs
  { type: "General Contractor",    category: "Maintenance & Repairs", icon: "🏗️" },
  { type: "Plumber",               category: "Maintenance & Repairs", icon: "🔧" },
  { type: "Electrician",           category: "Maintenance & Repairs", icon: "⚡" },
  { type: "HVAC",                  category: "Maintenance & Repairs", icon: "❄️" },
  { type: "Roofer",                category: "Maintenance & Repairs", icon: "🏠" },
  { type: "Appliance Repair",      category: "Maintenance & Repairs", icon: "🛠️" },
  { type: "Handyman",              category: "Maintenance & Repairs", icon: "🔨" },
  { type: "Garage Door Service",   category: "Maintenance & Repairs", icon: "🚪" },
  { type: "Chimney Sweep",         category: "Maintenance & Repairs", icon: "🏚️" },
  { type: "Generator Service",     category: "Maintenance & Repairs", icon: "⚡" },
  { type: "Water Softener",        category: "Maintenance & Repairs", icon: "💧" },
  { type: "Septic Service",        category: "Maintenance & Repairs", icon: "🔩" },
  // Outdoor & Property
  { type: "Landscaper",            category: "Outdoor & Property",    icon: "🌿" },
  { type: "Lawn Care",             category: "Outdoor & Property",    icon: "🌱" },
  { type: "Tree Service",          category: "Outdoor & Property",    icon: "🌳" },
  { type: "Pool Service",          category: "Outdoor & Property",    icon: "🏊" },
  { type: "Gutter Cleaning",       category: "Outdoor & Property",    icon: "🌧️" },
  { type: "Snow Removal",          category: "Outdoor & Property",    icon: "⛄" },
  { type: "Irrigation System",     category: "Outdoor & Property",    icon: "💦" },
  { type: "Pressure Washing",      category: "Outdoor & Property",    icon: "🚿" },
  { type: "Solar Panel Service",   category: "Outdoor & Property",    icon: "☀️" },
  { type: "Fence & Gate",          category: "Outdoor & Property",    icon: "🪵" },
  // Cleaning Services
  { type: "House Cleaner",         category: "Cleaning Services",     icon: "🧹" },
  { type: "Window Cleaner",        category: "Cleaning Services",     icon: "🪟" },
  { type: "Carpet Cleaner",        category: "Cleaning Services",     icon: "🧽" },
  { type: "Pest Control",          category: "Cleaning Services",     icon: "🐛" },
  { type: "Mold Remediation",      category: "Cleaning Services",     icon: "🦠" },
  { type: "Air Duct Cleaning",     category: "Cleaning Services",     icon: "💨" },
  // Security & Safety
  { type: "Locksmith",             category: "Security & Safety",     icon: "🔑" },
  { type: "Security System",       category: "Security & Safety",     icon: "🔒" },
  { type: "Fire Safety",           category: "Security & Safety",     icon: "🔥" },
  { type: "Alarm Monitoring",      category: "Security & Safety",     icon: "🚨" },
  // Design & Lifestyle
  { type: "Interior Designer",     category: "Design & Lifestyle",    icon: "🛋️" },
  { type: "Painter",               category: "Design & Lifestyle",    icon: "🎨" },
  { type: "Moving Company",        category: "Design & Lifestyle",    icon: "📦" },
  { type: "Auto Detailer",         category: "Design & Lifestyle",    icon: "🚗" },
  { type: "Personal Chef",         category: "Design & Lifestyle",    icon: "👨‍🍳" },
  { type: "Catering",              category: "Design & Lifestyle",    icon: "🍽️" },
  { type: "Grocery Delivery",      category: "Design & Lifestyle",    icon: "🛒" },
  { type: "Dry Cleaning",          category: "Design & Lifestyle",    icon: "👔" },
  { type: "Pet Services",          category: "Design & Lifestyle",    icon: "🐾" },
  { type: "Elder Care",            category: "Design & Lifestyle",    icon: "🧓" },
  // Technology
  { type: "Smart Home Tech",       category: "Technology",            icon: "📱" },
  { type: "Home Theater / AV",     category: "Technology",            icon: "📺" },
  { type: "Internet / Networking", category: "Technology",            icon: "📡" },
  { type: "Elevator / Lift",       category: "Technology",            icon: "🛗" },
];

const TYPE_MAP = Object.fromEntries(VENDOR_TYPES.map((v) => [v.type, v]));

const DEFAULT_VENDORS: { name: string; type: string; category: string }[] = [
  // Maintenance & Repairs
  { name: "General Contractor (TBD)",  type: "General Contractor",  category: "Maintenance & Repairs" },
  { name: "Plumber (TBD)",             type: "Plumber",             category: "Maintenance & Repairs" },
  { name: "Electrician (TBD)",         type: "Electrician",         category: "Maintenance & Repairs" },
  { name: "HVAC Technician (TBD)",     type: "HVAC",                category: "Maintenance & Repairs" },
  { name: "Roofer (TBD)",              type: "Roofer",              category: "Maintenance & Repairs" },
  { name: "Appliance Repair (TBD)",    type: "Appliance Repair",    category: "Maintenance & Repairs" },
  { name: "Handyman (TBD)",            type: "Handyman",            category: "Maintenance & Repairs" },
  { name: "Garage Door Service (TBD)", type: "Garage Door Service", category: "Maintenance & Repairs" },
  { name: "Chimney Sweep (TBD)",       type: "Chimney Sweep",       category: "Maintenance & Repairs" },
  { name: "Generator Service (TBD)",   type: "Generator Service",   category: "Maintenance & Repairs" },
  { name: "Water Softener (TBD)",      type: "Water Softener",      category: "Maintenance & Repairs" },
  { name: "Septic Service (TBD)",      type: "Septic Service",      category: "Maintenance & Repairs" },
  // Outdoor & Property
  { name: "Landscaper (TBD)",          type: "Landscaper",          category: "Outdoor & Property" },
  { name: "Lawn Care (TBD)",           type: "Lawn Care",           category: "Outdoor & Property" },
  { name: "Tree Service (TBD)",        type: "Tree Service",        category: "Outdoor & Property" },
  { name: "Pool Service (TBD)",        type: "Pool Service",        category: "Outdoor & Property" },
  { name: "Gutter Cleaning (TBD)",     type: "Gutter Cleaning",     category: "Outdoor & Property" },
  { name: "Snow Removal (TBD)",        type: "Snow Removal",        category: "Outdoor & Property" },
  { name: "Irrigation System (TBD)",   type: "Irrigation System",   category: "Outdoor & Property" },
  { name: "Pressure Washing (TBD)",    type: "Pressure Washing",    category: "Outdoor & Property" },
  { name: "Solar Panel Service (TBD)", type: "Solar Panel Service", category: "Outdoor & Property" },
  { name: "Fence & Gate (TBD)",        type: "Fence & Gate",        category: "Outdoor & Property" },
  // Cleaning Services
  { name: "House Cleaner (TBD)",       type: "House Cleaner",       category: "Cleaning Services" },
  { name: "Window Cleaner (TBD)",      type: "Window Cleaner",      category: "Cleaning Services" },
  { name: "Carpet Cleaner (TBD)",      type: "Carpet Cleaner",      category: "Cleaning Services" },
  { name: "Pest Control (TBD)",        type: "Pest Control",        category: "Cleaning Services" },
  { name: "Mold Remediation (TBD)",    type: "Mold Remediation",    category: "Cleaning Services" },
  { name: "Air Duct Cleaning (TBD)",   type: "Air Duct Cleaning",   category: "Cleaning Services" },
  // Security & Safety
  { name: "Locksmith (TBD)",           type: "Locksmith",           category: "Security & Safety" },
  { name: "Security System (TBD)",     type: "Security System",     category: "Security & Safety" },
  { name: "Fire Safety (TBD)",         type: "Fire Safety",         category: "Security & Safety" },
  { name: "Alarm Monitoring (TBD)",    type: "Alarm Monitoring",    category: "Security & Safety" },
  // Design & Lifestyle
  { name: "Interior Designer (TBD)",   type: "Interior Designer",   category: "Design & Lifestyle" },
  { name: "Painter (TBD)",             type: "Painter",             category: "Design & Lifestyle" },
  { name: "Moving Company (TBD)",      type: "Moving Company",      category: "Design & Lifestyle" },
  { name: "Auto Detailer (TBD)",       type: "Auto Detailer",       category: "Design & Lifestyle" },
  { name: "Personal Chef (TBD)",       type: "Personal Chef",       category: "Design & Lifestyle" },
  { name: "Catering (TBD)",            type: "Catering",            category: "Design & Lifestyle" },
  { name: "Grocery Delivery (TBD)",    type: "Grocery Delivery",    category: "Design & Lifestyle" },
  { name: "Dry Cleaning (TBD)",        type: "Dry Cleaning",        category: "Design & Lifestyle" },
  { name: "Pet Services (TBD)",        type: "Pet Services",        category: "Design & Lifestyle" },
  { name: "Elder Care (TBD)",          type: "Elder Care",          category: "Design & Lifestyle" },
  // Technology
  { name: "Smart Home Tech (TBD)",     type: "Smart Home Tech",     category: "Technology" },
  { name: "Home Theater / AV (TBD)",   type: "Home Theater / AV",   category: "Technology" },
  { name: "Internet / Networking (TBD)", type: "Internet / Networking", category: "Technology" },
  { name: "Elevator / Lift (TBD)",     type: "Elevator / Lift",     category: "Technology" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function vendorIcon(v: Vendor) {
  return v.type ? (TYPE_MAP[v.type]?.icon ?? "🔧") : "🔧";
}

function formatCurrency(n: number | null) {
  if (n == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function isTBD(v: Vendor) {
  return v.name.includes("(TBD)") && !v.phone && !v.email && !v.website;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", phone: "", email: "", website: "", address: "",
    license: "", type: "", category: "", notes: "", approvalLimit: "", preferred: false,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    const res = await fetch("/api/vendors");
    if (res.ok) setVendors(await res.json());
  }, []);

  useEffect(() => {
    if (role === undefined) return;
    async function init() {
      setLoading(true);
      try {
        const res = await fetch("/api/vendors");
        if (!res.ok) return;
        const data: Vendor[] = await res.json();
        if (role === "OWNER") {
          // Add any vendor types not yet in the account (works for new + existing accounts)
          const existingTypes = new Set(data.map((v) => v.type).filter(Boolean));
          const missing = DEFAULT_VENDORS.filter((dv) => !existingTypes.has(dv.type));
          if (missing.length > 0) {
            for (const v of missing) {
              await fetch("/api/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(v),
              });
            }
            await fetchVendors();
          } else {
            setVendors(data);
          }
        } else {
          setVendors(data);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [role, fetchVendors]);

  // Filter
  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.notes ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      v.category === activeCategory ||
      TYPE_MAP[v.type ?? ""]?.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for grid view
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    vendors: filtered.filter(
      (v) => v.category === cat.id || TYPE_MAP[v.type ?? ""]?.category === cat.id
    ),
  })).filter((g) => g.vendors.length > 0);

  const uncategorized = filtered.filter(
    (v) => !v.category && !TYPE_MAP[v.type ?? ""]?.category
  );

  // Counts per category for pills
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((cat) => [
      cat.id,
      vendors.filter(
        (v) => v.category === cat.id || TYPE_MAP[v.type ?? ""]?.category === cat.id
      ).length,
    ])
  );

  // Modal helpers
  function openAdd() {
    setEditVendor(null);
    setForm({ name: "", phone: "", email: "", website: "", address: "", license: "", type: "", category: "", notes: "", approvalLimit: "", preferred: false });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(v: Vendor) {
    setEditVendor(v);
    setForm({
      name: v.name, phone: v.phone ?? "", email: v.email ?? "",
      website: v.website ?? "", address: v.address ?? "", license: v.license ?? "",
      type: v.type ?? "", category: v.category ?? TYPE_MAP[v.type ?? ""]?.category ?? "",
      notes: v.notes ?? "", approvalLimit: v.approvalLimit?.toString() ?? "",
      preferred: v.preferred,
    });
    setFormError("");
    setShowModal(true);
  }

  // Auto-fill category when type changes
  function handleTypeChange(type: string) {
    const cat = TYPE_MAP[type]?.category ?? "";
    setForm((f) => ({ ...f, type, category: cat }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setFormSubmitting(true);
    try {
      // Normalize website URL — add https:// if user typed www.example.com or example.com
      const rawWebsite = form.website.trim();
      const normalizedWebsite = rawWebsite
        ? /^https?:\/\//i.test(rawWebsite)
          ? rawWebsite
          : `https://${rawWebsite}`
        : undefined;

      const body: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: normalizedWebsite,
        address: form.address || undefined,
        license: form.license || undefined,
        type: form.type || undefined,
        category: form.category || undefined,
        notes: form.notes || undefined,
        preferred: form.preferred,
        approvalLimit: form.approvalLimit ? parseFloat(form.approvalLimit) : undefined,
      };
      if (editVendor) body.id = editVendor.id;

      const res = await fetch("/api/vendors", {
        method: editVendor ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) { setShowModal(false); fetchVendors(); }
      else { const d = await res.json(); setFormError(d.error ?? "Failed to save vendor."); }
    } finally {
      setFormSubmitting(false);
    }
  }

  async function deleteVendor(id: string) {
    if (!confirm("Delete this vendor?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vendors?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchVendors();
    } finally { setDeletingId(null); }
  }

  async function togglePreferred(v: Vendor) {
    await fetch("/api/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, preferred: !v.preferred }),
    });
    fetchVendors();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {vendors.length} vendors · {vendors.filter((v) => !isTBD(v)).length} active · {vendors.filter((v) => v.preferred).length} preferred
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm transition ${viewMode === "grid" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm transition ${viewMode === "list" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              ☰ List
            </button>
          </div>
          {role === "OWNER" && (
            <button onClick={openAdd} className="btn-primary text-sm">
              + Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Search + Category filters */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search vendors, types, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-80"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeCategory === "All"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({vendors.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.icon} {cat.label} ({categoryCounts[cat.id] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-medium text-slate-600">
            {vendors.length === 0 ? "No vendors yet." : "No vendors match your search."}
          </p>
          {role === "OWNER" && vendors.length === 0 && (
            <button onClick={openAdd} className="mt-4 btn-primary text-sm">
              + Add First Vendor
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* ── List view ── */
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Limit</th>
                {role === "OWNER" && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 transition ${isTBD(v) ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{vendorIcon(v)}</span>
                      <div>
                        <p className="font-medium text-slate-900 leading-tight">
                          {v.name.replace(" (TBD)", "")}
                          {v.preferred && <span className="ml-1.5 text-amber-500 text-xs">⭐</span>}
                          {isTBD(v) && <span className="ml-1.5 text-xs text-slate-400 font-normal">TBD</span>}
                        </p>
                        {v.type && <p className="text-xs text-slate-400">{v.type}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {(() => {
                      const cat = v.category ?? TYPE_MAP[v.type ?? ""]?.category;
                      if (!cat) return <span className="text-slate-300">—</span>;
                      const catObj = CATEGORIES.find((c) => c.id === cat);
                      return (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catObj?.color ?? "bg-slate-100 text-slate-600"}`}>
                          {catObj?.icon} {catObj?.label ?? cat}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {v.phone ? (
                      <a href={`tel:${v.phone}`} className="text-brand-600 hover:underline">{v.phone}</a>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {v.email ? (
                      <a href={`mailto:${v.email}`} className="text-brand-600 hover:underline truncate max-w-[160px] block">{v.email}</a>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                    {formatCurrency(v.approvalLimit) ?? <span className="text-slate-300">—</span>}
                  </td>
                  {role === "OWNER" && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => togglePreferred(v)} title={v.preferred ? "Remove preferred" : "Mark preferred"} className="text-slate-300 hover:text-amber-400 p-1 transition">⭐</button>
                        <button onClick={() => openEdit(v)} className="text-slate-300 hover:text-brand-600 p-1 transition">✏️</button>
                        <button onClick={() => deleteVendor(v.id)} disabled={deletingId === v.id} className="text-slate-300 hover:text-red-500 p-1 transition">🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Grid view — grouped by category ── */
        <div className="space-y-8">
          {(activeCategory === "All" ? grouped : grouped.filter((g) => g.id === activeCategory)).map((group) => (
            <div key={group.id}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{group.icon}</span>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{group.label}</h2>
                <span className="text-xs text-slate-400 font-medium">({group.vendors.length})</span>
                <div className="flex-1 border-t border-slate-200 ml-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.vendors.map((v) => (
                  <VendorCard
                    key={v.id}
                    vendor={v}
                    role={role}
                    onEdit={openEdit}
                    onDelete={deleteVendor}
                    onTogglePreferred={togglePreferred}
                    deleting={deletingId === v.id}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📁</span>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Other</h2>
                <div className="flex-1 border-t border-slate-200 ml-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {uncategorized.map((v) => (
                  <VendorCard
                    key={v.id}
                    vendor={v}
                    role={role}
                    onEdit={openEdit}
                    onDelete={deleteVendor}
                    onTogglePreferred={togglePreferred}
                    deleting={deletingId === v.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-800 text-lg">
                {editVendor ? "Edit Vendor" : "Add Vendor"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              {/* Name + Preferred */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Business Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input w-full" required />
              </div>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Service Type</label>
                  <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className="input w-full">
                    <option value="">Select type…</option>
                    {CATEGORIES.map((cat) => (
                      <optgroup key={cat.id} label={`${cat.icon} ${cat.label}`}>
                        {VENDOR_TYPES.filter((vt) => vt.category === cat.id).map((vt) => (
                          <option key={vt.type} value={vt.type}>{vt.icon} {vt.type}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Approval Limit ($)</label>
                  <input type="number" value={form.approvalLimit} onChange={(e) => setForm((f) => ({ ...f, approvalLimit: e.target.value }))} min="0" step="0.01" className="input w-full" placeholder="e.g. 500" />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="vendor@email.com" />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="input w-full" placeholder="www.vendorsite.com" />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input w-full" placeholder="123 Main St, City, State" />
              </div>

              {/* License */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">License / Insurance #</label>
                <input type="text" value={form.license} onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))} className="input w-full" placeholder="License or insurance number" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="input w-full resize-none" placeholder="Gate code, preferred contact method, past jobs…" />
              </div>

              {/* Preferred toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, preferred: !f.preferred }))}
                  className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${form.preferred ? "bg-amber-400" : "bg-slate-200"}`}
                >
                  <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mt-[3px] ${form.preferred ? "translate-x-4" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-slate-700 font-medium">⭐ Mark as Preferred Vendor</span>
              </label>

              {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="btn-primary text-sm">
                  {formSubmitting ? "Saving…" : editVendor ? "Save Changes" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── VendorCard sub-component ──────────────────────────────────────────────────

function VendorCard({
  vendor: v,
  role,
  onEdit,
  onDelete,
  onTogglePreferred,
  deleting,
}: {
  vendor: Vendor;
  role?: string;
  onEdit: (v: Vendor) => void;
  onDelete: (id: string) => void;
  onTogglePreferred: (v: Vendor) => void;
  deleting: boolean;
}) {
  const tbd = isTBD(v);

  return (
    <div
      className={`relative flex flex-col rounded-xl border transition ${
        tbd
          ? "border-dashed border-slate-200 bg-slate-50/60 opacity-70"
          : v.preferred
          ? "border-amber-300 bg-amber-50/30 shadow-sm"
          : "border-slate-200 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      {/* Preferred star */}
      {v.preferred && !tbd && (
        <span className="absolute top-2.5 right-2.5 text-amber-400 text-sm">⭐</span>
      )}

      <div className="p-4 flex-1">
        {/* Icon + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${tbd ? "bg-slate-100" : "bg-brand-50"}`}>
            {vendorIcon(v)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">
              {v.name.replace(" (TBD)", "")}
            </h3>
            {v.type && (
              <p className="text-xs text-slate-400 mt-0.5">{v.type}</p>
            )}
            {tbd && (
              <span className="inline-block text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded mt-1 font-medium">
                TBD — tap to add
              </span>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-xs text-slate-600">
          {v.phone && (
            <a href={`tel:${v.phone}`} className="flex items-center gap-2 hover:text-brand-600 transition">
              <span>📞</span> {v.phone}
            </a>
          )}
          {v.email && (
            <a href={`mailto:${v.email}`} className="flex items-center gap-2 hover:text-brand-600 transition truncate">
              <span>✉️</span> <span className="truncate">{v.email}</span>
            </a>
          )}
          {v.website && (
            <a href={v.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-600 transition truncate">
              <span>🌐</span> <span className="truncate">{v.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {v.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(v.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-brand-600 transition"
            >
              <span>📍</span> <span className="truncate">{v.address}</span>
            </a>
          )}
          {v.license && (
            <div className="flex items-center gap-2 text-slate-400">
              <span>🪪</span> <span>{v.license}</span>
            </div>
          )}
          {v.approvalLimit != null && (
            <div className="flex items-center gap-2 text-slate-400">
              <span>💰</span> Limit: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v.approvalLimit)}
            </div>
          )}
        </div>

        {v.notes && (
          <p className="text-xs text-slate-400 border-t border-slate-100 pt-2 mt-2 line-clamp-2">
            {v.notes}
          </p>
        )}
      </div>

      {/* Card footer actions */}
      {role === "OWNER" && (
        <div className="flex items-center justify-end gap-0.5 px-3 py-2 border-t border-slate-100">
          <button
            onClick={() => onTogglePreferred(v)}
            title={v.preferred ? "Remove preferred" : "Mark preferred"}
            className={`p-1.5 rounded-lg text-xs transition ${v.preferred ? "text-amber-400 hover:text-amber-600" : "text-slate-300 hover:text-amber-400"}`}
          >⭐</button>
          <button
            onClick={() => onEdit(v)}
            className="p-1.5 rounded-lg text-xs text-slate-300 hover:text-brand-600 transition"
          >✏️</button>
          <button
            onClick={() => onDelete(v.id)}
            disabled={deleting}
            className="p-1.5 rounded-lg text-xs text-slate-300 hover:text-red-500 transition disabled:opacity-50"
          >🗑️</button>
        </div>
      )}
    </div>
  );
}
