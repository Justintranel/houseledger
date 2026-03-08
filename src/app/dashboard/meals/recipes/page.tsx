"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Ingredient {
  name: string;
  quantity: string;
  productUrl?: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  prepMins: number | null;
  cookMins: number | null;
  ingredients: Ingredient[];
  createdAt: string;
}

export default function RecipesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fServings, setFServings] = useState("");
  const [fPrepMins, setFPrepMins] = useState("");
  const [fCookMins, setFCookMins] = useState("");
  const [fIngredients, setFIngredients] = useState<Ingredient[]>([]);
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchRecipes() {
    setLoading(true);
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) setRecipes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRecipes(); }, []);

  function openAdd() {
    setEditRecipe(null);
    setFTitle(""); setFDescription(""); setFServings(""); setFPrepMins(""); setFCookMins("");
    setFIngredients([{ name: "", quantity: "", productUrl: "" }]);
    setFError(""); setShowModal(true);
  }

  function openEdit(r: Recipe) {
    setEditRecipe(r);
    setFTitle(r.title);
    setFDescription(r.description ?? "");
    setFServings(r.servings?.toString() ?? "");
    setFPrepMins(r.prepMins?.toString() ?? "");
    setFCookMins(r.cookMins?.toString() ?? "");
    setFIngredients(r.ingredients.length > 0 ? r.ingredients : [{ name: "", quantity: "", productUrl: "" }]);
    setFError(""); setShowModal(true);
  }

  function addIngredient() {
    setFIngredients(prev => [...prev, { name: "", quantity: "", productUrl: "" }]);
  }

  function removeIngredient(i: number) {
    setFIngredients(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setFIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFError(""); setFSubmitting(true);
    try {
      const validIngredients = fIngredients.filter(ing => ing.name.trim() && ing.quantity.trim()).map(ing => ({
        name: ing.name.trim(),
        quantity: ing.quantity.trim(),
        ...(ing.productUrl?.trim() ? { productUrl: ing.productUrl.trim() } : {}),
      }));

      const body: Record<string, unknown> = { title: fTitle.trim(), ingredients: validIngredients };
      if (fDescription.trim()) body.description = fDescription.trim();
      if (fServings) body.servings = parseInt(fServings);
      if (fPrepMins) body.prepMins = parseInt(fPrepMins);
      if (fCookMins) body.cookMins = parseInt(fCookMins);

      const url = editRecipe ? `/api/recipes/${editRecipe.id}` : "/api/recipes";
      const method = editRecipe ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        await fetchRecipes();
      } else {
        const data = await res.json();
        setFError(data.error ?? "Failed to save recipe.");
      }
    } finally {
      setFSubmitting(false);
    }
  }

  async function deleteRecipe(id: string) {
    if (!confirm("Delete this recipe?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) await fetchRecipes();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recipe Book 📖</h1>
          <p className="text-slate-500 text-sm mt-0.5">Save your family favorites and add ingredient links.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/meals" className="text-sm text-brand-600 hover:underline font-medium">
            ← Meal Calendar
          </Link>
          {canWrite && (
            <button onClick={openAdd} className="btn-primary text-sm">+ Add Recipe</button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading recipes…</p>
      ) : recipes.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🍳</p>
          <p className="font-medium text-slate-600">No recipes saved yet.</p>
          {canWrite && (
            <button onClick={openAdd} className="mt-4 btn-primary text-sm">Add Your First Recipe →</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <div key={r.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-slate-900 leading-tight">{r.title}</h3>
                {canWrite && (
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(r)} className="text-slate-400 hover:text-brand-600 p-1" title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteRecipe(r.id)} disabled={deletingId === r.id} className="text-slate-400 hover:text-red-500 p-1" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {r.description && (
                <p className="text-sm text-slate-500 line-clamp-2">{r.description}</p>
              )}
              <div className="flex gap-3 text-xs text-slate-500">
                {r.servings && <span>🍽️ {r.servings} servings</span>}
                {r.prepMins && <span>⏱️ {r.prepMins}m prep</span>}
                {r.cookMins && <span>🔥 {r.cookMins}m cook</span>}
              </div>
              {r.ingredients.length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Ingredients ({r.ingredients.length})
                  </p>
                  <ul className="space-y-1">
                    {r.ingredients.slice(0, 4).map((ing, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-slate-400">•</span>
                        <span>{ing.quantity} {ing.name}</span>
                        {ing.productUrl && (
                          <a href={ing.productUrl} target="_blank" rel="noopener noreferrer"
                            className="text-brand-600 hover:underline ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                            🛒
                          </a>
                        )}
                      </li>
                    ))}
                    {r.ingredients.length > 4 && (
                      <li className="text-xs text-slate-400">+{r.ingredients.length - 4} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editRecipe ? "Edit Recipe" : "Add Recipe"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recipe Name *</label>
                <input type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="input w-full" required placeholder="Grandma's Lasagna" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={2} className="input w-full resize-none" placeholder="A quick description…" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Servings</label>
                  <input type="number" value={fServings} onChange={(e) => setFServings(e.target.value)} className="input w-full" min="1" placeholder="4" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prep (min)</label>
                  <input type="number" value={fPrepMins} onChange={(e) => setFPrepMins(e.target.value)} className="input w-full" min="0" placeholder="15" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cook (min)</label>
                  <input type="number" value={fCookMins} onChange={(e) => setFCookMins(e.target.value)} className="input w-full" min="0" placeholder="45" />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Ingredients</label>
                  <button type="button" onClick={addIngredient} className="text-xs text-brand-600 hover:underline font-medium">+ Add Row</button>
                </div>
                <div className="space-y-2">
                  {fIngredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                        className="input w-20 text-sm"
                        placeholder="2 cups"
                      />
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(i, "name", e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="Ingredient name"
                      />
                      <input
                        type="url"
                        value={ing.productUrl ?? ""}
                        onChange={(e) => updateIngredient(i, "productUrl", e.target.value)}
                        className="input w-32 text-sm"
                        placeholder="Product URL"
                      />
                      <button type="button" onClick={() => removeIngredient(i)} className="text-slate-300 hover:text-red-400 p-1.5 mt-0.5">✕</button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Add product links so your house manager can reorder items easily.</p>
              </div>

              {fError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={fSubmitting} className="btn-primary text-sm">
                  {fSubmitting ? "Saving…" : editRecipe ? "Save Changes" : "Add Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
