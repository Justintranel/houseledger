"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isToday,
} from "date-fns";
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

const MEAL_META: Record<string, { label: string; emoji: string; color: string }> = {
  BREAKFAST: { label: "Breakfast", emoji: "🌅", color: "bg-amber-50 border-amber-200" },
  LUNCH:     { label: "Lunch",     emoji: "☀️",  color: "bg-sky-50 border-sky-200" },
  DINNER:    { label: "Dinner",    emoji: "🌙",  color: "bg-indigo-50 border-indigo-200" },
  SNACK:     { label: "Snack",     emoji: "🍎",  color: "bg-emerald-50 border-emerald-200" },
};

const CHIP_COLORS: Record<string, string> = {
  BREAKFAST: "bg-amber-500",
  LUNCH:     "bg-sky-500",
  DINNER:    "bg-indigo-600",
  SNACK:     "bg-emerald-500",
};

// ── Draggable recipe card (sidebar) ──────────────────────────────────────────

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
      className={`bg-white border border-slate-200 rounded-lg p-2.5 cursor-grab active:cursor-grabbing mb-1.5 select-none transition ${
        isDragging ? "opacity-40 shadow-xl" : "hover:border-brand-300 hover:shadow-sm"
      }`}
    >
      <p className="font-medium text-xs text-slate-800 leading-tight">{recipe.title}</p>
      {(recipe.prepMins || recipe.cookMins) && (
        <p className="text-xs text-slate-400 mt-0.5">
          {recipe.prepMins ? `${recipe.prepMins}m prep` : ""}
          {recipe.prepMins && recipe.cookMins ? " · " : ""}
          {recipe.cookMins ? `${recipe.cookMins}m cook` : ""}
        </p>
      )}
    </div>
  );
}

// ── Droppable meal slot ───────────────────────────────────────────────────────

function MealSlot({
  cellId,
  mealType,
  plans,
  canWrite,
  onRemove,
}: {
  cellId: string;
  mealType: string;
  plans: MealPlan[];
  canWrite: boolean;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId });
  const meta = MEAL_META[mealType];

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-1.5 transition min-h-[52px] ${
        isOver
          ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
          : meta.color
      }`}
    >
      {plans.length === 0 && (
        <p className="text-xs text-slate-300 text-center mt-1 select-none">drop here</p>
      )}
      {plans.map((mp) => (
        <div
          key={mp.id}
          className={`${CHIP_COLORS[mealType]} text-white text-xs rounded px-1.5 py-0.5 mb-0.5 flex items-start gap-1 group`}
        >
          <span className="flex-1 leading-tight break-words min-w-0">
            {mp.recipe?.title ?? mp.customTitle ?? "Meal"}
          </span>
          {canWrite && (
            <button
              onClick={() => onRemove(mp.id)}
              className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition shrink-0 text-xs leading-none mt-px"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MealCalendarPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [recipes, setRecipes]     = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const fromStr  = format(weekStart, "yyyy-MM-dd");
  const toStr    = format(addDays(weekStart, 6), "yyyy-MM-dd");

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

  function getPlans(dateStr: string, mealType: string): MealPlan[] {
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

    const parts     = (over.id as string).split("_");
    if (parts.length < 2) return;
    const mealType  = parts[parts.length - 1];
    const dateStr   = parts.slice(0, parts.length - 1).join("_");

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
    if (res.ok) setMealPlans((prev) => prev.filter((mp) => mp.id !== planId));
  }

  const monthLabel = format(weekStart, "MMMM yyyy");

  return (
    <div className="h-full flex flex-col py-4 px-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Meal Planner</h1>
          <p className="text-slate-400 text-xs mt-0.5">Drag recipes onto the calendar to plan your week</p>
        </div>
        <Link href="/dashboard/meals/recipes" className="btn-secondary text-xs px-3 py-1.5">
          📖 Recipe Book
        </Link>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

          {/* ── Left sidebar: Recipe library ── */}
          <div className="w-48 shrink-0 flex flex-col">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recipes</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="flex-1 overflow-y-auto pr-0.5">
              {loading ? (
                <p className="text-xs text-slate-400">Loading…</p>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 mb-1">
                    {recipes.length === 0 ? "No recipes yet." : "No results."}
                  </p>
                  {recipes.length === 0 && canWrite && (
                    <Link href="/dashboard/meals/recipes" className="text-xs text-brand-600 hover:underline">
                      Add recipes →
                    </Link>
                  )}
                </div>
              ) : (
                filteredRecipes.map((r) => (
                  <DraggableRecipeCard key={r.id} recipe={r} />
                ))
              )}
            </div>
          </div>

          {/* ── Right: Calendar grid ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Week navigation */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{monthLabel}</p>
                <p className="text-xs text-slate-400">
                  {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
                </p>
              </div>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="ml-1 text-xs text-brand-600 hover:underline"
              >
                Today
              </button>
            </div>

            {/* Calendar — 7 columns, one per day */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 gap-1.5 min-w-[700px]">

                {/* Day header row */}
                {weekDays.map((day) => {
                  const today = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`text-center pb-2 border-b-2 ${
                        today ? "border-brand-500" : "border-slate-200"
                      }`}
                    >
                      <p className={`text-xs font-semibold uppercase tracking-wide ${today ? "text-brand-600" : "text-slate-500"}`}>
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-lg font-bold leading-none mt-0.5 ${
                        today
                          ? "w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto text-sm"
                          : "text-slate-800"
                      }`}>
                        {format(day, "d")}
                      </p>
                    </div>
                  );
                })}

                {/* Meal slots — for each day, show all 4 meal types stacked */}
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const today   = isToday(day);
                  return (
                    <div
                      key={dateStr}
                      className={`space-y-1.5 pt-2 rounded-xl p-1.5 ${
                        today ? "bg-brand-50/40 ring-1 ring-brand-200" : ""
                      }`}
                    >
                      {MEAL_TYPES.map((mealType) => {
                        const plans  = getPlans(dateStr, mealType);
                        const cellId = `${dateStr}_${mealType}`;
                        const meta   = MEAL_META[mealType];
                        return (
                          <div key={mealType}>
                            <p className="text-xs text-slate-400 flex items-center gap-0.5 mb-0.5 leading-none">
                              <span>{meta.emoji}</span>
                              <span className="font-medium">{meta.label}</span>
                            </p>
                            <MealSlot
                              cellId={cellId}
                              mealType={mealType}
                              plans={plans}
                              canWrite={canWrite}
                              onRemove={removeMealPlan}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeRecipe && (
            <div className="bg-white border border-brand-300 shadow-xl rounded-lg p-2.5 cursor-grabbing w-44 opacity-95">
              <p className="font-medium text-xs text-slate-800">{activeRecipe.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
