"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string | null;
  notes: string | null;
  approvalLimit: number | null;
  createdAt: string;
}

const VENDOR_TYPES = [
  "General Contractor","Plumber","Electrician","HVAC","Landscaper",
  "Pool Service","Pest Control","House Cleaner","Window Cleaner","Carpet Cleaner",
  "Painter","Handyman","Roofer","Appliance Repair","Locksmith",
  "Garage Door Service","Security System","Tree Service","Gutter Cleaning","Snow Removal",
  "Interior Designer","Moving Company","Auto Detailer","Grocery Delivery","Catering",
];

const TYPE_ICON_MAP: Record<string, string> = {
  "General Contractor": "🏗️",
  "Plumber": "🔧",
  "Electrician": "⚡",
  "HVAC": "❄️",
  "Landscaper": "🌿",
  "Pool Service": "🏊",
  "Pest Control": "🐛",
  "House Cleaner": "🧹",
  "Window Cleaner": "🪟",
  "Carpet Cleaner": "🧽",
  "Painter": "🎨",
  "Handyman": "🔨",
  "Roofer": "🏠",
  "Appliance Repair": "🛠️",
  "Locksmith": "🔑",
  "Garage Door Service": "🚪",
  "Security System": "🔒",
  "Tree Service": "🌳",
  "Gutter Cleaning": "🌧️",
  "Snow Removal": "⛄",
  "Interior Designer": "🛋️",
  "Moving Company": "📦",
  "Auto Detailer": "🚗",
  "Grocery Delivery": "🛒",
  "Catering": "🍽️",
};

const TYPE_BADGE_MAP: Record<string, string> = {
  "General Contractor": "badge-blue",
  "Plumber": "badge-blue",
  "Electrician": "badge-blue",
  "HVAC": "badge-blue",
  "Roofer": "badge-blue",
  "Appliance Repair": "badge-blue",
  "Handyman": "badge-blue",
  "Painter": "badge-blue",
  "Garage Door Service": "badge-blue",
  "House Cleaner": "badge-green",
  "Window Cleaner": "badge-green",
  "Carpet Cleaner": "badge-green",
  "Landscaper": "badge-green",
  "Pool Service": "badge-green",
  "Tree Service": "badge-green",
  "Gutter Cleaning": "badge-green",
  "Snow Removal": "badge-green",
  "Pest Control": "badge-green",
  "Locksmith": "badge-yellow",
  "Security System": "badge-yellow",
  "Interior Designer": "badge-slate",
  "Moving Company": "badge-slate",
  "Auto Detailer": "badge-slate",
  "Grocery Delivery": "badge-slate",
  "Catering": "badge-slate",
};

const DEFAULT_VENDORS = [
  { name: "General Contractor (TBD)", type: "General Contractor" },
  { name: "Plumber (TBD)", type: "Plumber" },
  { name: "Electrician (TBD)", type: "Electrician" },
  { name: "HVAC Technician (TBD)", type: "HVAC" },
  { name: "Landscaper (TBD)", type: "Landscaper" },
  { name: "Pool Service (TBD)", type: "Pool Service" },
  { name: "Pest Control (TBD)", type: "Pest Control" },
  { name: "House Cleaner (TBD)", type: "House Cleaner" },
  { name: "Window Cleaner (TBD)", type: "Window Cleaner" },
  { name: "Carpet Cleaner (TBD)", type: "Carpet Cleaner" },
  { name: "Painter (TBD)", type: "Painter" },
  { name: "Handyman (TBD)", type: "Handyman" },
  { name: "Roofer (TBD)", type: "Roofer" },
  { name: "Appliance Repair (TBD)", type: "Appliance Repair" },
  { name: "Locksmith (TBD)", type: "Locksmith" },
  { name: "Garage Door Service (TBD)", type: "Garage Door Service" },
  { name: "Security System (TBD)", type: "Security System" },
  { name: "Tree Service (TBD)", type: "Tree Service" },
  { name: "Gutter Cleaning (TBD)", type: "Gutter Cleaning" },
  { name: "Snow Removal (TBD)", type: "Snow Removal" },
  { name: "Interior Designer (TBD)", type: "Interior Designer" },
  { name: "Moving Company (TBD)", type: "Moving Company" },
  { name: "Auto Detailer (TBD)", type: "Auto Detailer" },
  { name: "Grocery Delivery (TBD)", type: "Grocery Delivery" },
  { name: "Catering (TBD)", type: "Catering" },
];

export default function VendorsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formApprovalLimit, setFormApprovalLimit] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res = await fetch("/api/vendors");
        if (!res.ok) { setLoading(false); return; }
        const data: Vendor[] = await res.json();
        if (data.length === 0 && role === "OWNER") {
          for (const v of DEFAULT_VENDORS) {
            await fetch("/api/vendors", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(v),
            });
          }
          await fetchVendors();
        } else {
          setVendors(data);
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    }
    if (role !== undefined) init();
  }, [role, fetchVendors]);

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.type ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openAddModal() {
    setEditVendor(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormType("");
    setFormNotes("");
    setFormApprovalLimit("");
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(v: Vendor) {
    setEditVendor(v);
    setFormName(v.name);
    setFormPhone(v.phone ?? "");
    setFormEmail(v.email ?? "");
    setFormType(v.type ?? "");
    setFormNotes(v.notes ?? "");
    setFormApprovalLimit(v.approvalLimit?.toString() ?? "");
    setFormError("");
    setShowModal(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormSubmitting(true);

    const body: Record<string, unknown> = {
      name: formName.trim(),
    };
    if (formPhone) body.phone = formPhone;
    if (formEmail) body.email = formEmail;
    if (formType) body.type = formType;
    if (formNotes) body.notes = formNotes;
    if (formApprovalLimit)
      body.approvalLimit = parseFloat(formApprovalLimit);

    try {
      let res: Response;
      if (editVendor) {
        res = await fetch("/api/vendors", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editVendor.id, ...body }),
        });
      } else {
        res = await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchVendors();
      } else {
        const data = await res.json();
        setFormError(data.error ?? "Failed to save vendor.");
      }
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
    } finally {
      setDeletingId(null);
    }
  }

  function formatCurrency(n: number | null) {
    if (n == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Directory</h1>
        {role === "OWNER" && (
          <button onClick={openAddModal} className="btn-primary text-sm">
            + Add Vendor
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search vendors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full sm:w-72 mb-4"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading vendors...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {vendors.length === 0 ? "No vendors yet." : "No vendors match your search."}
          {role === "OWNER" && vendors.length === 0 && (
            <button
              onClick={openAddModal}
              className="block mx-auto mt-3 btn-primary text-sm"
            >
              + Add First Vendor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none shrink-0 mt-0.5">
                  {v.type ? (TYPE_ICON_MAP[v.type] ?? "🔧") : "🔧"}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{v.name}</h3>
                  {v.type && (
                    <span className={`badge ${TYPE_BADGE_MAP[v.type] ?? "badge-slate"} mt-1`}>
                      {v.type}
                    </span>
                  )}
                </div>
                {role === "OWNER" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(v)}
                      className="text-xs text-gray-400 hover:text-brand-600 p-1"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteVendor(v.id)}
                      disabled={deletingId === v.id}
                      className="text-xs text-gray-400 hover:text-red-500 p-1"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {v.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-12">Phone</span>
                    <a href={`tel:${v.phone}`} className="text-brand-600 hover:underline">{v.phone}</a>
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-12">Email</span>
                    <a href={`mailto:${v.email}`} className="text-brand-600 hover:underline truncate">{v.email}</a>
                  </div>
                )}
                {v.approvalLimit != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-12">Limit</span>
                    <span>{formatCurrency(v.approvalLimit)}</span>
                  </div>
                )}
              </div>
              {v.notes && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 line-clamp-2">{v.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                {editVendor ? "Edit Vendor" : "Add Vendor"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className="input w-full">
                    <option value="">Select type</option>
                    {VENDOR_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Approval Limit ($)
                  </label>
                  <input
                    type="number"
                    value={formApprovalLimit}
                    onChange={(e) => setFormApprovalLimit(e.target.value)}
                    min="0"
                    step="0.01"
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary text-sm"
                >
                  {formSubmitting
                    ? "Saving..."
                    : editVendor
                    ? "Save Changes"
                    : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
