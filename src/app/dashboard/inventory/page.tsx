"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  qty: number;
  unit: string | null;
  threshold: number | null;
  productUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type GroupedItems = { category: string; items: InventoryItem[] }[];

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Inline editing states
  const [editingUrl, setEditingUrl] = useState<{ id: string; url: string } | null>(null);
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newThreshold, setNewThreshold] = useState("1");
  const [newUrl, setNewUrl] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category ?? "Uncategorized"))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== "All") {
      list = list.filter((i) => (i.category ?? "Uncategorized") === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCategory, search]);

  const grouped: GroupedItems = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    for (const item of filtered) {
      const cat = item.category ?? "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({ category, items }));
  }, [filtered]);

  const lowStockCount = useMemo(
    () => items.filter((i) => i.threshold !== null && i.qty <= (i.threshold ?? 0)).length,
    [items]
  );

  const linkedCount = useMemo(
    () => items.filter((i) => i.productUrl).length,
    [items]
  );

  async function saveProductUrl(id: string, url: string) {
    setSavingUrl(id);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: url || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setEditingUrl(null);
      }
    } finally {
      setSavingUrl(null);
    }
  }

  async function adjustQty(item: InventoryItem, delta: number) {
    setAdjustingId(item.id);
    try {
      const res = await fetch(`/api/inventory/${item.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, note: "" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + delta } : i))
        );
      }
    } finally {
      setAdjustingId(null);
    }
  }

  // ── Starter items ────────────────────────────────────────────────────────
  const STARTER_ITEMS = [
    // Cleaning Supplies
    { name: "Paper Towels", category: "Cleaning Supplies", unit: "roll", threshold: 4 },
    { name: "Dish Soap", category: "Cleaning Supplies", unit: "bottle", threshold: 1 },
    { name: "All-Purpose Cleaner", category: "Cleaning Supplies", unit: "bottle", threshold: 1 },
    { name: "Trash Bags (Kitchen)", category: "Cleaning Supplies", unit: "box", threshold: 1 },
    { name: "Trash Bags (Outdoor)", category: "Cleaning Supplies", unit: "box", threshold: 1 },
    { name: "Sponges", category: "Cleaning Supplies", unit: "pack", threshold: 1 },
    { name: "Laundry Detergent", category: "Cleaning Supplies", unit: "bottle", threshold: 1 },
    { name: "Dryer Sheets", category: "Cleaning Supplies", unit: "box", threshold: 1 },
    { name: "Dishwasher Pods", category: "Cleaning Supplies", unit: "box", threshold: 1 },
    { name: "Glass Cleaner", category: "Cleaning Supplies", unit: "bottle", threshold: 1 },
    // Bathroom
    { name: "Toilet Paper", category: "Bathroom", unit: "roll", threshold: 8 },
    { name: "Hand Soap", category: "Bathroom", unit: "bottle", threshold: 2 },
    { name: "Shampoo", category: "Bathroom", unit: "bottle", threshold: 1 },
    { name: "Conditioner", category: "Bathroom", unit: "bottle", threshold: 1 },
    { name: "Body Wash", category: "Bathroom", unit: "bottle", threshold: 1 },
    { name: "Toothpaste", category: "Bathroom", unit: "tube", threshold: 2 },
    { name: "Facial Tissue", category: "Bathroom", unit: "box", threshold: 2 },
    // Kitchen & Pantry
    { name: "Coffee", category: "Kitchen & Pantry", unit: "bag", threshold: 1 },
    { name: "Olive Oil", category: "Kitchen & Pantry", unit: "bottle", threshold: 1 },
    { name: "Aluminum Foil", category: "Kitchen & Pantry", unit: "roll", threshold: 1 },
    { name: "Plastic Wrap", category: "Kitchen & Pantry", unit: "roll", threshold: 1 },
    { name: "Zip-Lock Bags (Quart)", category: "Kitchen & Pantry", unit: "box", threshold: 1 },
    { name: "Zip-Lock Bags (Gallon)", category: "Kitchen & Pantry", unit: "box", threshold: 1 },
    { name: "Bottled Water", category: "Kitchen & Pantry", unit: "case", threshold: 2 },
    { name: "Dish Soap (Dishwasher)", category: "Kitchen & Pantry", unit: "bottle", threshold: 1 },
    // Office & Misc
    { name: "Printer Paper", category: "Office", unit: "ream", threshold: 1 },
    { name: "Pens", category: "Office", unit: "pack", threshold: 1 },
    { name: "Batteries AA", category: "Office", unit: "pack", threshold: 1 },
    { name: "Batteries AAA", category: "Office", unit: "pack", threshold: 1 },
    // Outdoor & Garage
    { name: "Light Bulbs (LED)", category: "Outdoor & Garage", unit: "pack", threshold: 1 },
    { name: "Outdoor Trash Bags", category: "Outdoor & Garage", unit: "box", threshold: 1 },
  ];

  async function seedStarterItems() {
    setSeeding(true);
    try {
      for (const item of STARTER_ITEMS) {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      await fetchItems();
    } finally {
      setSeeding(false);
    }
  }

  async function submitAddItem(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) {
      setAddError("Name is required.");
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory.trim() || undefined,
          unit: newUnit.trim() || undefined,
          threshold: parseInt(newThreshold, 10) || 1,
          productUrl: newUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewCategory("");
        setNewUnit("");
        setNewThreshold("1");
        setNewUrl("");
        setShowAddForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        setAddError(data.error ?? "Failed to add item.");
      }
    } finally {
      setAddSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isOwner ? "Shopping List" : "Inventory"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOwner
              ? "Set product links for each item so your house manager knows exactly what to buy."
              : "View household supplies and click Buy links to reorder items."}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="btn-primary text-sm"
          >
            {showAddForm ? "Cancel" : "+ Add Item"}
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card py-3 px-4">
          <p className="text-2xl font-bold text-slate-800">{items.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Items</p>
        </div>
        <div className={`card py-3 px-4 ${lowStockCount > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {lowStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Low / Out of Stock</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-2xl font-bold text-slate-800">{linkedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwner ? "Items with Buy Links" : "Buyable Items"}
          </p>
        </div>
      </div>

      {/* Add item form */}
      {showAddForm && isOwner && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Add Custom Item</h2>
          <form onSubmit={submitAddItem} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dish Soap"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Cleaning Supplies"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="e.g. bottle, pack"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Alert When Below</label>
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  min="0"
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Link (optional)</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.amazon.com/..."
                className="input w-full"
              />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={addSubmitting} className="btn-primary text-sm">
                {addSubmitting ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="input flex-1"
        />
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                activeCategory === cat
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading inventory…</p>
      ) : grouped.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          {search ? (
            <p>No items match your search.</p>
          ) : isOwner ? (
            <div className="max-w-sm mx-auto">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold text-slate-600 mb-1">Your shopping list is empty</p>
              <p className="text-sm text-slate-400 mb-5">
                Add items individually, or click below to pre-populate with 31 common household essentials across Cleaning, Bathroom, Kitchen, and Office categories.
              </p>
              <button
                onClick={seedStarterItems}
                disabled={seeding}
                className="btn-primary text-sm mx-auto"
              >
                {seeding ? "Adding starter items…" : "📋 Populate with Common Household Items"}
              </button>
              <p className="text-xs text-slate-400 mt-3">You can edit, delete, or add more items after.</p>
            </div>
          ) : (
            <p>No inventory items yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">
                {category}
                <span className="ml-2 font-normal normal-case text-slate-400">({catItems.length})</span>
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Qty</th>
                      {isManager && (
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Adjust</th>
                      )}
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {isOwner ? "Buy Link" : "Purchase"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {catItems.map((item) => {
                      const isLow = item.threshold !== null && item.qty <= (item.threshold ?? 0);
                      const isEditingThis = editingUrl?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/60 transition ${isLow ? "bg-amber-50/60" : ""}`}
                        >
                          {/* Name */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{item.name}</span>
                              {item.unit && (
                                <span className="text-xs text-slate-400">/ {item.unit}</span>
                              )}
                              {isLow && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                                  LOW
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-mono text-sm font-semibold ${isLow ? "text-amber-600" : "text-slate-700"}`}>
                              {item.qty}
                            </span>
                          </td>

                          {/* Adjust qty (MANAGER only) */}
                          {isManager && (
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => adjustQty(item, -1)}
                                  disabled={adjustingId === item.id || item.qty <= 0}
                                  className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold flex items-center justify-center"
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => adjustQty(item, 1)}
                                  disabled={adjustingId === item.id}
                                  className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          )}

                          {/* Buy link */}
                          <td className="px-4 py-2.5">
                            {isOwner ? (
                              isEditingThis ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    autoFocus
                                    type="url"
                                    value={editingUrl.url}
                                    onChange={(e) =>
                                      setEditingUrl({ id: item.id, url: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveProductUrl(item.id, editingUrl.url);
                                      if (e.key === "Escape") setEditingUrl(null);
                                    }}
                                    placeholder="https://..."
                                    className="input text-xs py-1 flex-1 min-w-0"
                                  />
                                  <button
                                    onClick={() => saveProductUrl(item.id, editingUrl.url)}
                                    disabled={savingUrl === item.id}
                                    className="text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingUrl(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setEditingUrl({ id: item.id, url: item.productUrl ?? "" })
                                  }
                                  className="group flex items-center gap-1.5 text-xs transition"
                                >
                                  {item.productUrl ? (
                                    <span className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                      Link set
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 hover:text-brand-600 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add buy link
                                    </span>
                                  )}
                                </button>
                              )
                            ) : (
                              /* MANAGER: clickable Buy button */
                              item.productUrl ? (
                                <a
                                  href={item.productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition font-medium"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Buy
                                </a>
                              ) : (
                                <span className="text-xs text-slate-300">No link yet</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
