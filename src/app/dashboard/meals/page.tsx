"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, startOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface Ingredient {
  name: string;
  quantity: string;
  productUrl?: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  prepMins: number | null;
  cookMins: number | null;
  servings: number | null;
  ingredients: Ingredient[];
}

interface MealPlan {
  id: string;
  recipeId: string | null;
  customTitle: string | null;
  mealType: string;
  date: string;
  recipe: Recipe | null;
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

function DraggableRecipeCard({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: recipe.id,
    data: { recipe },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`card p-3 cursor-grab active:cursor-grabbing mb-2 select-none transition ${isDragging ? "opacity-50" : "hover:shadow-md"}`}
    >
      <p className="font-medium text-sm text-slate-800 leading-tight">{recipe.title}</p>
      <div className="flex gap-2 mt-1 text-xs text-slate-400">
        {recipe.prepMins && <span>⏱️ {recipe.prepMins}m</span>}
        {recipe.cookMins && <span>🔥 {recipe.cookMins}m</span>}
        {recipe.servings && <span>🍽️ {recipe.servings}</span>}
      </div>
    </div>
  );
}

function DroppableCell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[52px] rounded-lg p-1 transition ${isOver ? "bg-brand-50 ring-2 ring-brand-400" : "bg-slate-50 hover:bg-slate-100"}`}
    >
      {children}
    </div>
  );
}

export default function MealCalendarPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const fromStr = format(weekStart, "yyyy-MM-dd");
  const toStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const loadData = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch(`/api/mealplan?from=${from}&to=${to}`),
      ]);
      if (rRes.ok) setRecipes(await rRes.json());
      if (mRes.ok) setMealPlans(await mRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(fromStr, toStr);
  }, [weekStart, loadData, fromStr, toStr]);

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  function getMealPlansForSlot(dateStr: string, mealType: string): MealPlan[] {
    return mealPlans.filter(
      (mp) =>
        format(new Date(mp.date), "yyyy-MM-dd") === dateStr &&
        mp.mealType === mealType
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveRecipe(null);
    if (!over || !canWrite) return;

    const parts = (over.id as string).split("_");
    if (parts.length < 2) return;
    const mealType = parts[parts.length - 1];
    const dateStr = parts.slice(0, parts.length - 1).join("_");

    const res = await fetch("/api/mealplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: active.id as string, date: dateStr, mealType }),
    });
    if (res.ok) {
      const newPlan = await res.json();
      setMealPlans((prev) => [...prev, newPlan]);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const recipe = recipes.find((r) => r.id === event.active.id);
    if (recipe) setActiveRecipe(recipe);
  }

  async function removeMealPlan(planId: string) {
    const res = await fetch(`/api/mealplan/${planId}`, { method: "DELETE" });
    if (res.ok) {
      setMealPlans((prev) => prev.filter((mp) => mp.id !== planId));
    }
  }

  return (
    <div className="max-w-full py-6 px-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meal Planner 🍽️</h1>
          <p className="text-slate-500 text-sm mt-0.5">Drag recipes onto the calendar to plan your week.</p>
        </div>
        <Link href="/dashboard/meals/recipes" className="btn-secondary text-sm">
          📖 Recipe Book
        </Link>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="flex gap-4">
          {/* Left panel: Recipe library */}
          <div className="w-56 shrink-0">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Recipes
              </p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="input w-full text-sm mb-3"
              />
              {loading ? (
                <p className="text-xs text-slate-400">Loading…</p>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 mb-2">
                    {recipes.length === 0 ? "No recipes yet." : "No results."}
                  </p>
                  {recipes.length === 0 && canWrite && (
                    <Link href="/dashboard/meals/recipes" className="text-xs text-brand-600 hover:underline">
                      Add recipes →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                  {filteredRecipes.map((r) => (
                    <DraggableRecipeCard key={r.id} recipe={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Weekly calendar */}
          <div className="flex-1 overflow-x-auto">
            {/* Week navigation */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </span>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar grid */}
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">{format(day, "EEE")}</p>
                    <p className="text-sm font-bold text-slate-700">{format(day, "d")}</p>
                  </div>
                ))}
              </div>

              {/* Meal rows */}
              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 pl-1">
                    {MEAL_LABELS[mealType]}
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const cellId = `${dateStr}_${mealType}`;
                      const plans = getMealPlansForSlot(dateStr, mealType);
                      return (
                        <DroppableCell key={cellId} id={cellId}>
                          {plans.map((mp) => (
                            <div
                              key={mp.id}
                              className="bg-brand-600 text-white text-xs rounded px-1.5 py-0.5 mb-0.5 flex items-center gap-1 group"
                            >
                              <span className="flex-1 truncate">
                                {mp.recipe?.title ?? mp.customTitle ?? "Meal"}
                              </span>
                              {canWrite && (
                                <button
                                  onClick={() => removeMealPlan(mp.id)}
                                  className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition text-xs leading-none"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </DroppableCell>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeRecipe && (
            <div className="card p-3 shadow-xl cursor-grabbing w-52 opacity-90">
              <p className="font-medium text-sm text-slate-800">{activeRecipe.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
