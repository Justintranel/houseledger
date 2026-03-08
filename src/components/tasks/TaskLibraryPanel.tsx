"use client";

import { useState, useMemo } from "react";
import { format, startOfToday } from "date-fns";

// ── Library of common household tasks ──────────────────────────────────────

interface LibTask {
  title: string;
  category: string;
  description?: string;
  freq?: string; // suggested frequency label
}

const TASK_LIBRARY: LibTask[] = [
  // Daily
  { title: "Morning walkthrough — check all rooms", category: "Daily", freq: "Daily", description: "Quick visual inspection of all common areas each morning." },
  { title: "Make beds & tidy bedrooms", category: "Daily", freq: "Daily" },
  { title: "Empty trash cans (kitchen & bathrooms)", category: "Daily", freq: "Daily" },
  { title: "Wipe down kitchen counters & stovetop", category: "Daily", freq: "Daily" },
  { title: "Load/run/unload dishwasher", category: "Daily", freq: "Daily" },
  { title: "Sweep kitchen & dining room floors", category: "Daily", freq: "Daily" },
  { title: "Check & restock hand soap dispensers", category: "Daily", freq: "Daily" },
  { title: "Wipe bathroom counters & sinks", category: "Daily", freq: "Daily" },
  { title: "Check & feed pets", category: "Daily", freq: "Daily", description: "Feed, refresh water, and check on all pets." },
  { title: "Water indoor plants", category: "Daily", freq: "Daily" },
  { title: "Check mail & sort packages", category: "Daily", freq: "Daily" },
  { title: "Wipe down dining table after meals", category: "Daily", freq: "Daily" },
  { title: "Reset living areas (fluff pillows, fold throws)", category: "Daily", freq: "Daily" },

  // Weekly Cleaning
  { title: "Vacuum all carpets & rugs", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Mop hard floors throughout house", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Scrub toilet bowls & wipe seats", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Scrub showers & bathtubs", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Clean bathroom mirrors", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Wipe down all bathroom surfaces", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Change all bed linens & pillowcases", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Laundry — wash, dry, fold & put away", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Clean kitchen sink & drain", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Wipe microwave inside & out", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Wipe exterior of all kitchen appliances", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Dust ceiling fans & light fixtures", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Dust all furniture & surfaces", category: "Weekly Cleaning", freq: "Weekly" },
  { title: "Clean glass doors & windows (interior)", category: "Weekly Cleaning", freq: "Weekly" },

  // Grocery & Errands
  { title: "Grocery shopping — weekly stock", category: "Grocery & Errands", freq: "Weekly" },
  { title: "Check pantry & create grocery list", category: "Grocery & Errands", freq: "Weekly" },
  { title: "Check fridge — discard expired items", category: "Grocery & Errands", freq: "Weekly" },
  { title: "Pick up dry cleaning / laundry", category: "Grocery & Errands", freq: "Weekly" },
  { title: "Pick up prescriptions", category: "Grocery & Errands", freq: "As needed" },
  { title: "Restock household supplies (paper towels, soap, etc.)", category: "Grocery & Errands", freq: "As needed" },

  // Kitchen
  { title: "Deep clean oven (self-clean or manual)", category: "Kitchen", freq: "Monthly" },
  { title: "Clean refrigerator interior & shelves", category: "Kitchen", freq: "Monthly" },
  { title: "Clean dishwasher filter & run cleaning cycle", category: "Kitchen", freq: "Monthly" },
  { title: "Descale coffee machine / kettle", category: "Kitchen", freq: "Monthly" },
  { title: "Wipe range hood & replace filter if needed", category: "Kitchen", freq: "Monthly" },
  { title: "Clean disposal (ice + salt method)", category: "Kitchen", freq: "Bi-weekly" },
  { title: "Organize pantry — FIFO rotation", category: "Kitchen", freq: "Monthly" },
  { title: "Wipe down cabinet fronts", category: "Kitchen", freq: "Bi-weekly" },

  // Laundry & Linens
  { title: "Wash towels & bathrobes", category: "Laundry & Linens", freq: "Weekly" },
  { title: "Wash kitchen towels & dishcloths", category: "Laundry & Linens", freq: "Weekly" },
  { title: "Clean dryer lint trap", category: "Laundry & Linens", freq: "Weekly" },
  { title: "Clean washing machine drum", category: "Laundry & Linens", freq: "Monthly" },
  { title: "Rotate seasonal linens to storage", category: "Laundry & Linens", freq: "Seasonal" },

  // Outdoor & Yard
  { title: "Mow lawn & edge borders", category: "Outdoor & Yard", freq: "Weekly" },
  { title: "Water outdoor plants & garden", category: "Outdoor & Yard", freq: "Daily / Weekly" },
  { title: "Sweep patio, driveway & entry", category: "Outdoor & Yard", freq: "Weekly" },
  { title: "Blow out gutters & downspouts", category: "Outdoor & Yard", freq: "Monthly" },
  { title: "Trim hedges & shrubs", category: "Outdoor & Yard", freq: "Monthly" },
  { title: "Fertilize lawn", category: "Outdoor & Yard", freq: "Seasonal" },
  { title: "Check & maintain sprinkler system", category: "Outdoor & Yard", freq: "Monthly" },
  { title: "Pressure wash driveway & walkways", category: "Outdoor & Yard", freq: "Seasonal" },

  // Pool & Spa
  { title: "Check & balance pool chemistry", category: "Pool & Spa", freq: "2–3x Weekly" },
  { title: "Skim pool surface", category: "Pool & Spa", freq: "Daily" },
  { title: "Vacuum pool floor & brush walls", category: "Pool & Spa", freq: "Weekly" },
  { title: "Clean pool skimmer baskets", category: "Pool & Spa", freq: "Weekly" },
  { title: "Check pool equipment & pump", category: "Pool & Spa", freq: "Weekly" },
  { title: "Shock pool treatment", category: "Pool & Spa", freq: "Weekly" },
  { title: "Clean spa / hot tub & change water", category: "Pool & Spa", freq: "Monthly" },

  // Maintenance & Inspections
  { title: "Replace HVAC air filters", category: "Maintenance", freq: "Monthly" },
  { title: "Check smoke & CO detector batteries", category: "Maintenance", freq: "Monthly" },
  { title: "Test smoke / CO detectors", category: "Maintenance", freq: "Quarterly" },
  { title: "Check fire extinguisher pressure", category: "Maintenance", freq: "Quarterly" },
  { title: "Inspect plumbing for leaks", category: "Maintenance", freq: "Monthly" },
  { title: "Clean dryer vent duct", category: "Maintenance", freq: "Seasonal" },
  { title: "Service HVAC system (professional)", category: "Maintenance", freq: "Bi-Annual" },
  { title: "Flush water heater sediment", category: "Maintenance", freq: "Annually" },
  { title: "Check roof & gutters after storms", category: "Maintenance", freq: "As needed" },
  { title: "Lubricate door hinges & locks", category: "Maintenance", freq: "Quarterly" },
  { title: "Check weather stripping on doors/windows", category: "Maintenance", freq: "Seasonal" },
  { title: "Inspect garage door & lubricate", category: "Maintenance", freq: "Quarterly" },

  // Guest Preparation
  { title: "Prepare guest bedroom (fresh linens, towels)", category: "Guest Prep", freq: "As needed" },
  { title: "Stock guest bathroom (toiletries, towels)", category: "Guest Prep", freq: "As needed" },
  { title: "Fresh flowers / welcome touches", category: "Guest Prep", freq: "As needed" },
  { title: "Clean & organize guest closet", category: "Guest Prep", freq: "As needed" },

  // Vehicles
  { title: "Schedule car wash & interior detail", category: "Vehicles", freq: "Bi-weekly" },
  { title: "Check tire pressure on all vehicles", category: "Vehicles", freq: "Monthly" },
  { title: "Schedule oil change / service appointment", category: "Vehicles", freq: "As needed" },
  { title: "Check vehicle fluids (oil, coolant, washer)", category: "Vehicles", freq: "Monthly" },

  // Pets
  { title: "Pet bath / grooming appointment", category: "Pets", freq: "Monthly" },
  { title: "Clean pet bedding & toys", category: "Pets", freq: "Weekly" },
  { title: "Scoop litter boxes / clean pet areas", category: "Pets", freq: "Daily" },
  { title: "Vet appointment / vaccinations", category: "Pets", freq: "Annually" },
  { title: "Restock pet food & supplies", category: "Pets", freq: "As needed" },
];

const ALL_CATEGORIES = Array.from(new Set(TASK_LIBRARY.map((t) => t.category))).sort();

interface Props {
  onAddTask: (title: string, category: string, description: string | undefined, date: string) => Promise<void>;
}

export default function TaskLibraryPanel({ onAddTask }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [addingTitle, setAddingTitle] = useState<string | null>(null);
  const [addDate, setAddDate] = useState(format(startOfToday(), "yyyy-MM-dd"));
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = TASK_LIBRARY;
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, categoryFilter]);

  // Group by category for display
  const grouped = useMemo(() => {
    const map: Record<string, LibTask[]> = {};
    for (const t of filtered) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return Object.entries(map);
  }, [filtered]);

  async function handleAdd(task: LibTask) {
    setAddingTitle(task.title);
    try {
      await onAddTask(task.title, task.category, task.description, addDate);
      setAddedTitles((prev) => new Set([...Array.from(prev), task.title]));
      setTimeout(() => {
        setAddedTitles((prev) => {
          const s = new Set(Array.from(prev));
          s.delete(task.title);
          return s;
        });
      }, 3000);
    } finally {
      setAddingTitle(null);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header + search */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task library…"
            className="input flex-1 text-sm"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Add for:</label>
            <input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              className="input text-sm py-1.5 w-36"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${!categoryFilter ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${categoryFilter === cat ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">No tasks match your search.</p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-5">
            {grouped.map(([category, tasks]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</h3>
                <div className="space-y-1.5">
                  {tasks.map((task) => {
                    const isAdding = addingTitle === task.title;
                    const wasAdded = addedTitles.has(task.title);
                    return (
                      <div
                        key={task.title}
                        className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5 hover:border-slate-300 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{task.description}</p>
                          )}
                          {task.freq && (
                            <p className="text-xs text-brand-500 mt-0.5">⏱ {task.freq}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAdd(task)}
                          disabled={isAdding}
                          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                            wasAdded
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                          } disabled:opacity-50`}
                        >
                          {isAdding ? "Adding…" : wasAdded ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
