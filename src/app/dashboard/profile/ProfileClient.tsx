"use client";

import { useState } from "react";

interface ProfileAnswer {
  id: string;
  answer: string;
}

interface ProfileQuestion {
  id: string;
  prompt: string;
  category: string;
  ownerOnly: boolean;
  isCustom: boolean;
  answer: ProfileAnswer | null;
}

interface CategoryGroup {
  category: string;
  questions: ProfileQuestion[];
}

interface Props {
  categoryGroups: CategoryGroup[];
  role: string;
  availableCategories: string[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "General": "🏠",
  "Utilities": "⚡",
  "HVAC & Climate": "🌡️",
  "Plumbing": "🚿",
  "Electrical": "🔌",
  "Appliances": "🍳",
  "Security & Safety": "🔒",
  "Garden & Exterior": "🌿",
  "Insurance & Documents": "📄",
  "Emergency Contacts": "🚨",
  "Smart Home & Tech": "📡",
  "Service History": "🔧",
};

export default function ProfileClient({ categoryGroups: initialGroups, role, availableCategories }: Props) {
  const canEdit = role === "OWNER" || role === "FAMILY";
  const isOwner = role === "OWNER";

  const [groups, setGroups] = useState<CategoryGroup[]>(initialGroups);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of initialGroups) {
      for (const q of g.questions) {
        init[q.id] = q.answer?.answer ?? "";
      }
    }
    return init;
  });

  // Hidden answers — toggled per-question to mask the value
  const [hiddenAnswers, setHiddenAnswers] = useState<Set<string>>(new Set());

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialGroups.forEach((g, i) => { init[g.category] = i === 0; });
    return init;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [errorId, setErrorId] = useState<string | null>(null);

  // Add-question state
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [newOwnerOnly, setNewOwnerOnly] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
  const [addQError, setAddQError] = useState("");

  // New-section state
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrompt, setNewCatPrompt] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingOwnerOnly, setTogglingOwnerOnly] = useState<string | null>(null);

  // ownerOnly state per question (mirrors DB, kept in sync after toggle)
  const [ownerOnlyMap, setOwnerOnlyMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of initialGroups) {
      for (const q of g.questions) {
        init[q.id] = q.ownerOnly;
      }
    }
    return init;
  });

  const allQuestions = groups.flatMap((g) => g.questions);
  const totalQuestions = allQuestions.length;
  const totalAnswered = allQuestions.filter((q) => answers[q.id]).length;
  const progressPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function toggleHideAnswer(qId: string) {
    setHiddenAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  }

  function startEdit(questionId: string) {
    setEditingId(questionId);
    setDraftValue(answers[questionId] ?? "");
    setErrorId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftValue("");
    setErrorId(null);
  }

  async function saveAnswer(questionId: string) {
    if (savingId) return;
    setSavingId(questionId);
    setErrorId(null);
    try {
      const res = await fetch("/api/profile/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: draftValue }),
      });
      if (res.ok) {
        setAnswers((prev) => ({ ...prev, [questionId]: draftValue }));
        setEditingId(null);
        setSavedIds((prev) => new Set([...Array.from(prev), questionId]));
        setTimeout(() => setSavedIds((prev) => { const s = new Set(Array.from(prev)); s.delete(questionId); return s; }), 2000);
      } else {
        setErrorId(questionId);
      }
    } catch {
      setErrorId(questionId);
    } finally {
      setSavingId(null);
    }
  }

  async function addQuestion(category: string, prompt: string) {
    setAddingQ(true);
    setAddQError("");
    try {
      const res = await fetch("/api/profile/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, prompt: prompt.trim(), ownerOnly: newOwnerOnly }),
      });
      if (res.ok) {
        const q = await res.json();
        const newQ: ProfileQuestion = { id: q.id, prompt: q.prompt, category: q.category, ownerOnly: q.ownerOnly, isCustom: true, answer: null };
        setGroups((prev) => {
          const idx = prev.findIndex((g) => g.category === category);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], questions: [...updated[idx].questions, newQ] };
            return updated;
          }
          return [...prev, { category, questions: [newQ] }];
        });
        setAnswers((prev) => ({ ...prev, [q.id]: "" }));
        setOpenCategories((prev) => ({ ...prev, [category]: true }));
        setNewPrompt(""); setNewOwnerOnly(false); setAddingCategory(null);
        setShowNewCat(false); setNewCatName(""); setNewCatPrompt("");
      } else {
        const data = await res.json();
        setAddQError(data.error ?? "Failed to add");
      }
    } catch { setAddQError("Network error."); }
    finally { setAddingQ(false); }
  }

  async function deleteQuestion(qId: string, category: string) {
    setDeletingId(qId);
    try {
      const res = await fetch(`/api/profile/question/${qId}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) => g.category !== category ? g : { ...g, questions: g.questions.filter((q) => q.id !== qId) })
             .filter((g) => g.questions.length > 0)
        );
        setAnswers((prev) => { const n = { ...prev }; delete n[qId]; return n; });
      }
    } finally { setDeletingId(null); }
  }

  async function toggleOwnerOnly(qId: string) {
    const current = ownerOnlyMap[qId] ?? false;
    setTogglingOwnerOnly(qId);
    try {
      const res = await fetch(`/api/profile/question/${qId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerOnly: !current }),
      });
      if (res.ok) {
        setOwnerOnlyMap((prev) => ({ ...prev, [qId]: !current }));
      }
    } finally { setTogglingOwnerOnly(null); }
  }

  if (groups.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-12">No profile questions found.</p>;
  }

  return (
    <div className="space-y-4">
      {/* ── Progress bar ── */}
      <div className="card p-5 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{totalAnswered} of {totalQuestions} questions answered</span>
          <span className={`text-sm font-bold ${progressPct === 100 ? "text-emerald-600" : "text-brand-600"}`}>{progressPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full transition-all duration-500 ${progressPct === 100 ? "bg-emerald-500" : "bg-brand-600"}`} style={{ width: `${progressPct}%` }} />
        </div>
        {progressPct === 100 && <p className="text-xs text-emerald-600 font-medium mt-2">🎉 Profile complete!</p>}
        {!canEdit && progressPct < 100 && (
          <p className="text-xs text-slate-400 mt-2">Ask your owner to fill in the remaining {totalQuestions - totalAnswered} question{totalQuestions - totalAnswered !== 1 ? "s" : ""}.</p>
        )}
      </div>

      {/* ── Category accordions ── */}
      {groups.map((group) => {
        const answered = group.questions.filter((q) => answers[q.id]).length;
        const isOpen = !!openCategories[group.category];
        const icon = CATEGORY_ICONS[group.category] ?? "📋";
        const allDone = answered === group.questions.length;

        return (
          <div key={group.category} className="card overflow-hidden p-0">
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg">{icon}</span>
              <span className="flex-1 font-semibold text-slate-800">{group.category}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${allDone ? "bg-emerald-100 text-emerald-700" : answered > 0 ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
                {answered}/{group.questions.length}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {group.questions.map((q) => {
                  const currentAnswer = answers[q.id] ?? "";
                  const isEditing = editingId === q.id;
                  const isSaving = savingId === q.id;
                  const wasSaved = savedIds.has(q.id);
                  const hasError = errorId === q.id;
                  const isHidden = hiddenAnswers.has(q.id);

                  const isOwnerOnly = ownerOnlyMap[q.id] ?? q.ownerOnly;
                  const isTogglingThis = togglingOwnerOnly === q.id;

                  return (
                    <div key={q.id} className={`px-5 py-4 ${isEditing ? "bg-slate-50" : ""}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <p className="text-sm font-medium text-slate-700 flex-1 leading-snug">{q.prompt}</p>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {isOwnerOnly && <span className="badge badge-slate text-xs">Owner Only</span>}
                          {q.isCustom && isOwner && <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 font-medium">Custom</span>}
                          {wasSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
                          {/* Toggle visibility of answer */}
                          {canEdit && currentAnswer && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleHideAnswer(q.id); }}
                              className="text-xs text-slate-400 hover:text-slate-600 transition"
                              title={isHidden ? "Show answer" : "Hide answer"}
                            >
                              {isHidden ? "👁 Show" : "🙈 Hide"}
                            </button>
                          )}
                          {/* Manager visibility toggle — only for custom questions */}
                          {isOwner && q.isCustom && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleOwnerOnly(q.id); }}
                              disabled={isTogglingThis}
                              className={`text-xs px-1.5 py-0.5 rounded border transition disabled:opacity-50 ${
                                isOwnerOnly
                                  ? "border-slate-300 text-slate-500 bg-slate-50 hover:bg-slate-100"
                                  : "border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100"
                              }`}
                              title={isOwnerOnly ? "Currently hidden from house manager — click to make visible" : "Currently visible to house manager — click to hide"}
                            >
                              {isTogglingThis ? "…" : isOwnerOnly ? "Hidden from house manager" : "Visible to house manager"}
                            </button>
                          )}
                          {canEdit && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); startEdit(q.id); }}
                              className="text-xs text-brand-600 hover:text-brand-800 font-medium transition"
                            >
                              {currentAnswer ? "Edit" : "+ Add"}
                            </button>
                          )}
                          {isOwner && q.isCustom && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id, group.category); }}
                              disabled={deletingId === q.id}
                              className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50"
                              title="Delete question"
                            >
                              {deletingId === q.id ? "…" : "✕"}
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            rows={draftValue.split("\n").length > 2 ? 4 : 2}
                            className="input w-full resize-none text-sm"
                            autoFocus
                            placeholder="Type your answer…"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") cancelEdit();
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveAnswer(q.id);
                            }}
                          />
                          {hasError && <p className="text-xs text-red-500">Failed to save. Please try again.</p>}
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => saveAnswer(q.id)} disabled={isSaving || !draftValue.trim()} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                            <button type="button" onClick={cancelEdit} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                            <span className="text-xs text-slate-400 ml-1">⌘↵ to save</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`text-sm leading-relaxed ${
                            currentAnswer
                              ? isHidden ? "text-slate-400 italic font-mono tracking-widest select-none" : "text-slate-600"
                              : "text-slate-400 italic"
                          } ${canEdit && !isHidden ? "cursor-pointer hover:text-brand-700 transition-colors" : ""}`}
                          onClick={canEdit && !isHidden ? () => startEdit(q.id) : undefined}
                          title={canEdit && !isHidden ? "Click to edit" : undefined}
                        >
                          {isHidden && currentAnswer ? "••••••••••" : currentAnswer || "No answer yet"}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Add custom question ── */}
                {isOwner && (
                  <div className="px-5 py-3 bg-slate-50/60">
                    {addingCategory === group.category ? (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          type="text"
                          value={newPrompt}
                          onChange={(e) => setNewPrompt(e.target.value)}
                          placeholder="Enter your question…"
                          className="input w-full text-sm"
                          maxLength={500}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") { setAddingCategory(null); setNewPrompt(""); }
                            if (e.key === "Enter" && newPrompt.trim()) addQuestion(group.category, newPrompt);
                          }}
                        />
                        <label className="flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer">
                          <input type="checkbox" checked={newOwnerOnly} onChange={(e) => setNewOwnerOnly(e.target.checked)} className="accent-brand-600" />
                          Owner-only (hidden from house manager)
                        </label>
                        {addQError && <p className="text-xs text-red-500">{addQError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addQuestion(group.category, newPrompt)}
                            disabled={addingQ || !newPrompt.trim()}
                            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                          >
                            {addingQ ? "Adding…" : "Add Question"}
                          </button>
                          <button type="button" onClick={() => { setAddingCategory(null); setNewPrompt(""); setAddQError(""); }} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddingCategory(group.category); setNewPrompt(""); setAddQError(""); }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium transition flex items-center gap-1"
                      >
                        + Add custom question to this section
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add new category section ── */}
      {isOwner && (
        <div className="card p-5">
          {showNewCat ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">New Section</h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Pool & Spa"
                  className="input text-sm w-full"
                  list="cat-suggestions"
                  maxLength={100}
                />
                <datalist id="cat-suggestions">
                  {availableCategories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">First Question</label>
                <input
                  type="text"
                  value={newCatPrompt}
                  onChange={(e) => setNewCatPrompt(e.target.value)}
                  placeholder="Question prompt…"
                  className="input text-sm w-full"
                  maxLength={500}
                />
              </div>
              {addQError && <p className="text-xs text-red-500">{addQError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatName.trim() || !newCatPrompt.trim()) { setAddQError("Category name and question are required."); return; }
                    setAddQError("");
                    addQuestion(newCatName.trim(), newCatPrompt.trim());
                  }}
                  disabled={addingQ || !newCatName.trim() || !newCatPrompt.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {addingQ ? "Adding…" : "Add Section"}
                </button>
                <button type="button" onClick={() => { setShowNewCat(false); setNewCatName(""); setNewCatPrompt(""); setAddQError(""); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewCat(true)}
              className="w-full text-sm text-brand-600 hover:text-brand-800 font-medium transition flex items-center justify-center gap-2 py-1"
            >
              <span className="text-lg leading-none">+</span> Add New Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}
