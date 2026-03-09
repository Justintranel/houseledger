"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, differenceInDays, addDays } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MaintenanceItem {
  id: string;
  title: string;
  category: string;
  intervalDays: number | null;
  lastDoneAt: string | null;
  nextDueAt: string | null;
  notes: string | null;
  updatedAt: string;
}

interface VehicleService {
  id: string;
  serviceType: string;
  date: string;
  mileage: number | null;
  cost: number | null;
  notes: string | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
}

interface Vehicle {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  currentMileage: number | null;
  registrationExpiry: string | null;
  insuranceExpiry: string | null;
  notes: string | null;
  serviceRecords: VehicleService[];
}

// ── Maintenance categories + defaults ─────────────────────────────────────────

const MAINTENANCE_CATEGORIES = [
  "HVAC", "Plumbing", "Electrical", "Safety", "Appliances",
  "Exterior", "Pest Control", "Filters & Water", "Other",
];

const DEFAULT_MAINTENANCE: { title: string; category: string; intervalDays: number }[] = [
  { title: "HVAC Filter Replacement",       category: "HVAC",             intervalDays: 90  },
  { title: "HVAC Annual Service",           category: "HVAC",             intervalDays: 365 },
  { title: "Smoke Detector Test",           category: "Safety",           intervalDays: 30  },
  { title: "Smoke Detector Battery",        category: "Safety",           intervalDays: 365 },
  { title: "Carbon Monoxide Detector Test", category: "Safety",           intervalDays: 30  },
  { title: "Fire Extinguisher Check",       category: "Safety",           intervalDays: 365 },
  { title: "Water Heater Flush",            category: "Plumbing",         intervalDays: 365 },
  { title: "Dryer Vent Cleaning",           category: "Appliances",       intervalDays: 365 },
  { title: "Refrigerator Coil Cleaning",    category: "Appliances",       intervalDays: 180 },
  { title: "Dishwasher Filter Cleaning",    category: "Appliances",       intervalDays: 30  },
  { title: "Garbage Disposal Cleaning",     category: "Appliances",       intervalDays: 90  },
  { title: "Water Filter Replacement",      category: "Filters & Water",  intervalDays: 180 },
  { title: "Water Softener Salt",           category: "Filters & Water",  intervalDays: 60  },
  { title: "Gutter Cleaning",              category: "Exterior",         intervalDays: 180 },
  { title: "Window Washing",               category: "Exterior",         intervalDays: 90  },
  { title: "Pest Control Treatment",        category: "Pest Control",     intervalDays: 90  },
  { title: "GFCI Outlet Test",             category: "Electrical",       intervalDays: 180 },
  { title: "Whole-Home Surge Protector",    category: "Electrical",       intervalDays: 365 },
  { title: "Grout & Caulk Inspection",     category: "Plumbing",         intervalDays: 365 },
  { title: "Sump Pump Test",               category: "Plumbing",         intervalDays: 180 },
];

// ── Vehicle service types ──────────────────────────────────────────────────────

const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation", "Tire Replacement",
  "Brake Inspection", "Brake Replacement", "Air Filter",
  "Cabin Air Filter", "Fluid Top-Off", "Coolant Flush",
  "Transmission Service", "Battery Replacement", "Spark Plugs",
  "Alignment", "Wheel Balance", "Windshield Wipers",
  "State Inspection", "Emissions Test", "Registration Renewal",
  "Detailing", "Other",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntilDue(item: MaintenanceItem): number | null {
  if (!item.nextDueAt) return null;
  return differenceInDays(new Date(item.nextDueAt), new Date());
}

function dueStatus(item: MaintenanceItem): "overdue" | "soon" | "ok" | "unknown" {
  const days = daysUntilDue(item);
  if (days === null) return "unknown";
  if (days < 0) return "overdue";
  if (days <= 14) return "soon";
  return "ok";
}

function statusColor(status: ReturnType<typeof dueStatus>) {
  if (status === "overdue") return "text-red-600 bg-red-50 border-red-200";
  if (status === "soon") return "text-amber-600 bg-amber-50 border-amber-200";
  if (status === "ok") return "text-green-600 bg-green-50 border-green-200";
  return "text-slate-500 bg-slate-50 border-slate-200";
}

function statusLabel(item: MaintenanceItem) {
  const days = daysUntilDue(item);
  if (days === null) return item.lastDoneAt ? `Last: ${format(new Date(item.lastDoneAt), "MMM d, yyyy")}` : "Not tracked";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

function expiryStatus(dateStr: string | null): "expired" | "soon" | "ok" | null {
  if (!dateStr) return null;
  const days = differenceInDays(new Date(dateStr), new Date());
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

function expiryColor(status: ReturnType<typeof expiryStatus>) {
  if (status === "expired") return "text-red-600";
  if (status === "soon") return "text-amber-600";
  if (status === "ok") return "text-green-600";
  return "text-slate-400";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [tab, setTab] = useState<"house" | "vehicles">("house");

  // ── House Maintenance State ──
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<MaintenanceItem | null>(null);
  const [itemForm, setItemForm] = useState({
    title: "", category: "", intervalDays: "", notes: "", lastDoneAt: "",
  });
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemError, setItemError] = useState("");

  // ── Vehicles State ──
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    nickname: "", make: "", model: "", year: new Date().getFullYear().toString(),
    color: "", licensePlate: "", vin: "", currentMileage: "",
    registrationExpiry: "", insuranceExpiry: "", notes: "",
  });
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  // Service record state
  const [serviceVehicle, setServiceVehicle] = useState<Vehicle | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    serviceType: "", date: format(new Date(), "yyyy-MM-dd"), mileage: "",
    cost: "", notes: "", nextDueDate: "", nextDueMileage: "",
  });
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState("");

  // ── Fetch maintenance items ──
  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/maintenance");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    if (role === undefined) return;
    async function initItems() {
      setLoadingItems(true);
      try {
        const res = await fetch("/api/maintenance");
        if (!res.ok) return;
        const data: MaintenanceItem[] = await res.json();
        if (role === "OWNER" || role === "MANAGER") {
          // Seed missing defaults
          const existingTitles = new Set(data.map((i) => i.title));
          const missing = DEFAULT_MAINTENANCE.filter((d) => !existingTitles.has(d.title));
          if (missing.length > 0) {
            for (const d of missing) {
              await fetch("/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(d),
              });
            }
            await fetchItems();
          } else {
            setItems(data);
          }
        } else {
          setItems(data);
        }
      } finally {
        setLoadingItems(false);
      }
    }
    initItems();
  }, [role, fetchItems]);

  // ── Fetch vehicles ──
  const fetchVehicles = useCallback(async () => {
    const res = await fetch("/api/vehicles");
    if (res.ok) setVehicles(await res.json());
  }, []);

  useEffect(() => {
    if (role === undefined) return;
    setLoadingVehicles(true);
    fetchVehicles().finally(() => setLoadingVehicles(false));
  }, [role, fetchVehicles]);

  // ── Mark maintenance item as done ──
  async function markDone(item: MaintenanceItem) {
    const now = new Date().toISOString();
    const nextDue = item.intervalDays
      ? addDays(new Date(), item.intervalDays).toISOString()
      : null;
    await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, lastDoneAt: now, nextDueAt: nextDue }),
    });
    fetchItems();
  }

  // ── Maintenance form ──
  function openAddItem() {
    setEditItem(null);
    setItemForm({ title: "", category: "", intervalDays: "", notes: "", lastDoneAt: "" });
    setItemError("");
    setShowItemModal(true);
  }
  function openEditItem(item: MaintenanceItem) {
    setEditItem(item);
    setItemForm({
      title: item.title,
      category: item.category,
      intervalDays: item.intervalDays?.toString() ?? "",
      notes: item.notes ?? "",
      lastDoneAt: item.lastDoneAt ? format(new Date(item.lastDoneAt), "yyyy-MM-dd") : "",
    });
    setItemError("");
    setShowItemModal(true);
  }
  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemForm.title.trim()) { setItemError("Title is required."); return; }
    setItemSubmitting(true);
    try {
      const intervalDays = itemForm.intervalDays ? parseInt(itemForm.intervalDays) : undefined;
      const lastDoneAt = itemForm.lastDoneAt ? new Date(itemForm.lastDoneAt).toISOString() : undefined;
      const nextDueAt = lastDoneAt && intervalDays
        ? addDays(new Date(lastDoneAt), intervalDays).toISOString()
        : undefined;

      const body: Record<string, unknown> = {
        title: itemForm.title.trim(),
        category: itemForm.category || "Other",
        intervalDays: intervalDays ?? null,
        lastDoneAt: lastDoneAt ?? null,
        nextDueAt: nextDueAt ?? null,
        notes: itemForm.notes || null,
      };
      if (editItem) body.id = editItem.id;

      const res = await fetch("/api/maintenance", {
        method: editItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { setShowItemModal(false); fetchItems(); }
      else { const d = await res.json(); setItemError(d.error ?? "Failed to save."); }
    } finally { setItemSubmitting(false); }
  }
  async function deleteItem(id: string) {
    if (!confirm("Delete this maintenance item?")) return;
    await fetch(`/api/maintenance?id=${id}`, { method: "DELETE" });
    fetchItems();
  }

  // ── Vehicle form ──
  function openAddVehicle() {
    setEditVehicle(null);
    setVehicleForm({ nickname: "", make: "", model: "", year: new Date().getFullYear().toString(), color: "", licensePlate: "", vin: "", currentMileage: "", registrationExpiry: "", insuranceExpiry: "", notes: "" });
    setVehicleError("");
    setShowVehicleModal(true);
  }
  function openEditVehicle(v: Vehicle) {
    setEditVehicle(v);
    setVehicleForm({
      nickname: v.nickname ?? "",
      make: v.make, model: v.model, year: v.year.toString(),
      color: v.color ?? "", licensePlate: v.licensePlate ?? "", vin: v.vin ?? "",
      currentMileage: v.currentMileage?.toString() ?? "",
      registrationExpiry: v.registrationExpiry ? format(new Date(v.registrationExpiry), "yyyy-MM-dd") : "",
      insuranceExpiry: v.insuranceExpiry ? format(new Date(v.insuranceExpiry), "yyyy-MM-dd") : "",
      notes: v.notes ?? "",
    });
    setVehicleError("");
    setShowVehicleModal(true);
  }
  async function submitVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim()) { setVehicleError("Make and model are required."); return; }
    setVehicleSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        nickname: vehicleForm.nickname || null,
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: parseInt(vehicleForm.year),
        color: vehicleForm.color || null,
        licensePlate: vehicleForm.licensePlate || null,
        vin: vehicleForm.vin || null,
        currentMileage: vehicleForm.currentMileage ? parseInt(vehicleForm.currentMileage) : null,
        registrationExpiry: vehicleForm.registrationExpiry ? new Date(vehicleForm.registrationExpiry).toISOString() : null,
        insuranceExpiry: vehicleForm.insuranceExpiry ? new Date(vehicleForm.insuranceExpiry).toISOString() : null,
        notes: vehicleForm.notes || null,
      };
      if (editVehicle) body.id = editVehicle.id;

      const res = await fetch("/api/vehicles", {
        method: editVehicle ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { setShowVehicleModal(false); fetchVehicles(); }
      else { const d = await res.json(); setVehicleError(d.error ?? "Failed to save."); }
    } finally { setVehicleSubmitting(false); }
  }
  async function deleteVehicle(id: string) {
    if (!confirm("Delete this vehicle and all its service records?")) return;
    await fetch(`/api/vehicles?id=${id}`, { method: "DELETE" });
    fetchVehicles();
  }

  // ── Service record form ──
  function openServiceModal(v: Vehicle) {
    setServiceVehicle(v);
    setServiceForm({ serviceType: "", date: format(new Date(), "yyyy-MM-dd"), mileage: v.currentMileage?.toString() ?? "", cost: "", notes: "", nextDueDate: "", nextDueMileage: "" });
    setServiceError("");
    setShowServiceModal(true);
  }
  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.serviceType || !serviceVehicle) { setServiceError("Service type is required."); return; }
    setServiceSubmitting(true);
    try {
      const res = await fetch("/api/vehicles/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: serviceVehicle.id,
          serviceType: serviceForm.serviceType,
          date: new Date(serviceForm.date).toISOString(),
          mileage: serviceForm.mileage ? parseInt(serviceForm.mileage) : null,
          cost: serviceForm.cost ? parseFloat(serviceForm.cost) : null,
          notes: serviceForm.notes || null,
          nextDueDate: serviceForm.nextDueDate ? new Date(serviceForm.nextDueDate).toISOString() : null,
          nextDueMileage: serviceForm.nextDueMileage ? parseInt(serviceForm.nextDueMileage) : null,
        }),
      });
      if (res.ok) { setShowServiceModal(false); fetchVehicles(); }
      else { const d = await res.json(); setServiceError(d.error ?? "Failed to save."); }
    } finally { setServiceSubmitting(false); }
  }
  async function deleteService(id: string) {
    if (!confirm("Delete this service record?")) return;
    await fetch(`/api/vehicles/service?id=${id}`, { method: "DELETE" });
    fetchVehicles();
  }

  // ── Filtered items ──
  const filteredItems = items.filter(
    (i) => filterCategory === "All" || i.category === filterCategory
  );
  const overdueCount = items.filter((i) => dueStatus(i) === "overdue").length;
  const soonCount = items.filter((i) => dueStatus(i) === "soon").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track house maintenance schedules and vehicle records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {(["house", "vehicles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "house" ? "🏠 House Maintenance" : "🚗 Vehicles"}
            {t === "house" && overdueCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{overdueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── House Maintenance Tab ── */}
      {tab === "house" && (
        <div>
          {/* Summary pills */}
          {(overdueCount > 0 || soonCount > 0) && (
            <div className="flex gap-3 mb-5">
              {overdueCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  🔴 {overdueCount} overdue
                </div>
              )}
              {soonCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium">
                  🟡 {soonCount} due soon
                </div>
              )}
            </div>
          )}

          {/* Category filter + Add */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap gap-2">
              {["All", ...MAINTENANCE_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterCategory === cat ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat} {cat === "All" ? `(${items.length})` : `(${items.filter((i) => i.category === cat).length})`}
                </button>
              ))}
            </div>
            {(role === "OWNER" || role === "MANAGER") && (
              <button onClick={openAddItem} className="btn-primary text-sm shrink-0">+ Add Item</button>
            )}
          </div>

          {loadingItems ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">🔧</p>
              <p>No maintenance items yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const status = dueStatus(item);
                const color = statusColor(status);
                return (
                  <div key={item.id} className={`rounded-xl border p-4 bg-white shadow-sm ${status === "overdue" ? "border-red-200" : status === "soon" ? "border-amber-200" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">{item.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border ${color}`}>
                        {statusLabel(item)}
                      </span>
                    </div>

                    {item.intervalDays && (
                      <p className="text-xs text-slate-500 mb-2">
                        🔁 Every {item.intervalDays} days
                        {item.lastDoneAt && ` · Last: ${format(new Date(item.lastDoneAt), "MMM d, yyyy")}`}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-slate-400 italic line-clamp-2 mb-2">{item.notes}</p>
                    )}

                    <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                      {(role === "OWNER" || role === "MANAGER") && (
                        <button
                          onClick={() => markDone(item)}
                          className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg px-2 py-1.5 font-semibold transition"
                        >
                          ✓ Mark Done
                        </button>
                      )}
                      {(role === "OWNER" || role === "MANAGER") && (
                        <>
                          <button onClick={() => openEditItem(item)} className="p-1.5 text-slate-300 hover:text-brand-600 transition">✏️</button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Vehicles Tab ── */}
      {tab === "vehicles" && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <p className="text-sm text-slate-500">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} tracked</p>
            {(role === "OWNER" || role === "MANAGER") && (
              <button onClick={openAddVehicle} className="btn-primary text-sm">+ Add Vehicle</button>
            )}
          </div>

          {loadingVehicles ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">🚗</p>
              <p>No vehicles added yet.</p>
              {(role === "OWNER" || role === "MANAGER") && (
                <button onClick={openAddVehicle} className="mt-4 btn-primary text-sm">+ Add Vehicle</button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {vehicles.map((v) => {
                const regStatus = expiryStatus(v.registrationExpiry);
                const insStatus = expiryStatus(v.insuranceExpiry);
                const displayName = v.nickname || `${v.year} ${v.make} ${v.model}`;
                return (
                  <div key={v.id} className="card overflow-hidden">
                    {/* Vehicle header */}
                    <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-3xl shrink-0">
                          🚗
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900 text-lg leading-tight">{displayName}</h2>
                          {v.nickname && <p className="text-sm text-slate-400">{v.year} {v.make} {v.model}</p>}
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                            {v.color && <span>🎨 {v.color}</span>}
                            {v.licensePlate && <span>🪪 {v.licensePlate}</span>}
                            {v.currentMileage != null && <span>📍 {v.currentMileage.toLocaleString()} mi</span>}
                          </div>
                        </div>
                      </div>
                      {(role === "OWNER" || role === "MANAGER") && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openServiceModal(v)} className="btn-primary text-xs px-3 py-1.5">+ Log Service</button>
                          <button onClick={() => openEditVehicle(v)} className="p-2 text-slate-300 hover:text-brand-600 transition">✏️</button>
                          <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-300 hover:text-red-500 transition">🗑️</button>
                        </div>
                      )}
                    </div>

                    {/* Expiry badges + VIN */}
                    <div className="flex flex-wrap gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium uppercase tracking-wide">Registration</span>
                        <p className={`font-semibold mt-0.5 ${expiryColor(regStatus)}`}>
                          {v.registrationExpiry ? format(new Date(v.registrationExpiry), "MMM d, yyyy") : "—"}
                          {regStatus === "expired" && " ⚠️ Expired"}
                          {regStatus === "soon" && " ⚠️ Expiring soon"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium uppercase tracking-wide">Insurance</span>
                        <p className={`font-semibold mt-0.5 ${expiryColor(insStatus)}`}>
                          {v.insuranceExpiry ? format(new Date(v.insuranceExpiry), "MMM d, yyyy") : "—"}
                          {insStatus === "expired" && " ⚠️ Expired"}
                          {insStatus === "soon" && " ⚠️ Expiring soon"}
                        </p>
                      </div>
                      {v.vin && (
                        <div>
                          <span className="text-slate-400 font-medium uppercase tracking-wide">VIN</span>
                          <p className="font-mono text-slate-600 mt-0.5">{v.vin}</p>
                        </div>
                      )}
                    </div>

                    {/* Service history */}
                    <div className="px-5 py-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Service History</h3>
                      {v.serviceRecords.length === 0 ? (
                        <p className="text-sm text-slate-400">No service records yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {v.serviceRecords.map((s) => (
                            <div key={s.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-sm text-slate-800">{s.serviceType}</span>
                                  <span className="text-xs text-slate-400">{format(new Date(s.date), "MMM d, yyyy")}</span>
                                  {s.mileage != null && <span className="text-xs text-slate-400">@ {s.mileage.toLocaleString()} mi</span>}
                                  {s.cost != null && <span className="text-xs text-slate-500 font-medium">${s.cost.toFixed(2)}</span>}
                                </div>
                                {s.notes && <p className="text-xs text-slate-400 mt-0.5">{s.notes}</p>}
                                {s.nextDueDate && (
                                  <p className="text-xs text-brand-600 mt-0.5">
                                    Next due: {format(new Date(s.nextDueDate), "MMM d, yyyy")}
                                    {s.nextDueMileage != null && ` or ${s.nextDueMileage.toLocaleString()} mi`}
                                  </p>
                                )}
                              </div>
                              {(role === "OWNER" || role === "MANAGER") && (
                                <button onClick={() => deleteService(s.id)} className="text-slate-200 hover:text-red-400 transition text-xs shrink-0">🗑️</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {v.notes && (
                      <div className="px-5 pb-4">
                        <p className="text-xs text-slate-400 italic">{v.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Maintenance Item Modal ── */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-800">{editItem ? "Edit Item" : "Add Maintenance Item"}</h2>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={submitItem} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Task Name *</label>
                <input type="text" value={itemForm.title} onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))} className="input w-full" placeholder="e.g. HVAC Filter Replacement" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} className="input w-full">
                    <option value="">Select…</option>
                    {MAINTENANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Repeat Every (days)</label>
                  <input type="number" value={itemForm.intervalDays} onChange={(e) => setItemForm((f) => ({ ...f, intervalDays: e.target.value }))} className="input w-full" min="1" placeholder="e.g. 90" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Completed</label>
                <input type="date" value={itemForm.lastDoneAt} onChange={(e) => setItemForm((f) => ({ ...f, lastDoneAt: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="input w-full resize-none" placeholder="Brand, filter size, notes…" />
              </div>
              {itemError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{itemError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={itemSubmitting} className="btn-primary text-sm">{itemSubmitting ? "Saving…" : editItem ? "Save Changes" : "Add Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vehicle Modal ── */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-bold text-slate-800">{editVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={submitVehicle} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nickname (optional)</label>
                <input type="text" value={vehicleForm.nickname} onChange={(e) => setVehicleForm((f) => ({ ...f, nickname: e.target.value }))} className="input w-full" placeholder="e.g. Mom's SUV, Daily Driver" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year *</label>
                  <input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))} className="input w-full" min="1900" max="2100" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Make *</label>
                  <input type="text" value={vehicleForm.make} onChange={(e) => setVehicleForm((f) => ({ ...f, make: e.target.value }))} className="input w-full" placeholder="Toyota" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Model *</label>
                  <input type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} className="input w-full" placeholder="Camry" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Color</label>
                  <input type="text" value={vehicleForm.color} onChange={(e) => setVehicleForm((f) => ({ ...f, color: e.target.value }))} className="input w-full" placeholder="Pearl White" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">License Plate</label>
                  <input type="text" value={vehicleForm.licensePlate} onChange={(e) => setVehicleForm((f) => ({ ...f, licensePlate: e.target.value }))} className="input w-full" placeholder="ABC-1234" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Mileage</label>
                  <input type="number" value={vehicleForm.currentMileage} onChange={(e) => setVehicleForm((f) => ({ ...f, currentMileage: e.target.value }))} className="input w-full" min="0" placeholder="45,000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">VIN</label>
                  <input type="text" value={vehicleForm.vin} onChange={(e) => setVehicleForm((f) => ({ ...f, vin: e.target.value }))} className="input w-full" placeholder="17-digit VIN" maxLength={17} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Registration Expires</label>
                  <input type="date" value={vehicleForm.registrationExpiry} onChange={(e) => setVehicleForm((f) => ({ ...f, registrationExpiry: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Insurance Expires</label>
                  <input type="date" value={vehicleForm.insuranceExpiry} onChange={(e) => setVehicleForm((f) => ({ ...f, insuranceExpiry: e.target.value }))} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="Garage location, insurance provider, etc." />
              </div>
              {vehicleError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{vehicleError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={vehicleSubmitting} className="btn-primary text-sm">{vehicleSubmitting ? "Saving…" : editVehicle ? "Save Changes" : "Add Vehicle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Service Record Modal ── */}
      {showServiceModal && serviceVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-slate-800">Log Service</h2>
                <p className="text-xs text-slate-400">{serviceVehicle.nickname || `${serviceVehicle.year} ${serviceVehicle.make} ${serviceVehicle.model}`}</p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={submitService} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Service Type *</label>
                <select value={serviceForm.serviceType} onChange={(e) => setServiceForm((f) => ({ ...f, serviceType: e.target.value }))} className="input w-full" required>
                  <option value="">Select…</option>
                  {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                  <input type="date" value={serviceForm.date} onChange={(e) => setServiceForm((f) => ({ ...f, date: e.target.value }))} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mileage</label>
                  <input type="number" value={serviceForm.mileage} onChange={(e) => setServiceForm((f) => ({ ...f, mileage: e.target.value }))} className="input w-full" min="0" placeholder="45,000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cost ($)</label>
                <input type="number" value={serviceForm.cost} onChange={(e) => setServiceForm((f) => ({ ...f, cost: e.target.value }))} className="input w-full" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Next Due Date</label>
                  <input type="date" value={serviceForm.nextDueDate} onChange={(e) => setServiceForm((f) => ({ ...f, nextDueDate: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Next Due Mileage</label>
                  <input type="number" value={serviceForm.nextDueMileage} onChange={(e) => setServiceForm((f) => ({ ...f, nextDueMileage: e.target.value }))} className="input w-full" min="0" placeholder="50,000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea value={serviceForm.notes} onChange={(e) => setServiceForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input w-full resize-none" placeholder="Shop name, parts used, etc." />
              </div>
              {serviceError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serviceError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowServiceModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={serviceSubmitting} className="btn-primary text-sm">{serviceSubmitting ? "Saving…" : "Log Service"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
