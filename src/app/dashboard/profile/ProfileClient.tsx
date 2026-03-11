"use client";

import { useState, useEffect, useRef } from "react";

const NA_VALUE = "__NA__";

interface ProfileAnswer { id: string; answer: string; }
interface ProfileQuestion {
  id: string; prompt: string; category: string;
  ownerOnly: boolean; isCustom: boolean; answer: ProfileAnswer | null;
}
interface CategoryGroup { category: string; questions: ProfileQuestion[]; }
interface Props { categoryGroups: CategoryGroup[]; role: string; availableCategories: string[]; }

const CATEGORY_ICONS: Record<string, string> = {
  "General": "🏠", "Utilities": "⚡", "HVAC & Climate": "🌡️", "Plumbing": "🚿",
  "Electrical": "🔌", "Appliances": "🍳", "Security & Safety": "🔒", "Garden & Exterior": "🌿",
  "Insurance & Documents": "📄", "Emergency Contacts": "🚨", "Smart Home & Tech": "📡", "Service History": "🔧",
};

export default function ProfileClient({ categoryGroups: initialGroups, role, availableCategories }: Props) {
  const canEdit = role === "OWNER" || role === "FAMILY";
  const isOwner = role === "OWNER";

  const [groups, setGroups] = useState<CategoryGroup[]>(initialGroups);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of initialGroups) for (const q of g.questions) init[q.id] = q.answer?.answer ?? "";
    return init;
  });

  const [hiddenAnswers, setHiddenAnswers] = useState<Set<string>>(new Set());
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialGroups.forEach((g, i) => { init[g.category] = i === 0; });
    return init;
  });
  // Toggle to show N/A questions per category
  const [showNAinCat, setShowNAinCat] = useState<Record<string, boolean>>({});

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
  const [ownerOnlyMap, setOwnerOnlyMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of initialGroups) for (const q of g.questions) init[q.id] = q.ownerOnly;
    return init;
  });

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardQueue, setWizardQueue] = useState<ProfileQuestion[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardDraft, setWizardDraft] = useState("");
  const [wizardSaving, setWizardSaving] = useState(false);
  const [wizardError, setWizardError] = useState("");
  const [wizardDone, setWizardDone] = useState(false);
  const [wizardAnsweredCount, setWizardAnsweredCount] = useState(0);
  const [wizardNACount, setWizardNACount] = useState(0);
  const [wizardSkipCount, setWizardSkipCount] = useState(0);
  const wizardInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Derived values ───────────────────────────────────────────────────────────
  const allQuestions = groups.flatMap((g) => g.questions);
  const isNA = (qId: string) => answers[qId] === NA_VALUE;
  const isAnswered = (qId: string) => !!(answers[qId] && answers[qId] !== NA_VALUE);

  // Progress excludes N/A questions
  const visibleForProgress = allQuestions.filter((q) => !isNA(q.id));
  const totalQuestions = visibleForProgress.length;
  const totalAnswered = visibleForProgress.filter((q) => isAnswered(q.id)).length;
  const progressPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const unansweredCount = allQuestions.filter((q) => !isNA(q.id) && !isAnswered(q.id)).length;

  // Focus wizard input when question changes
  useEffect(() => {
    if (wizardActive && !wizardDone) {
      setTimeout(() => wizardInputRef.current?.focus(), 80);
    }
  }, [wizardActive, wizardIndex, wizardDone]);

  // ── Wizard functions ─────────────────────────────────────────────────────────
  function launchWizard() {
    const queue = allQuestions.filter((q) => !isNA(q.id) && !isAnswered(q.id));
    if (queue.length === 0) return;
    setWizardQueue(queue);
    setWizardIndex(0);
    setWizardDraft("");
    setWizardError("");
    setWizardDone(false);
    setWizardAnsweredCount(0);
    setWizardNACount(0);
    setWizardSkipCount(0);
    setWizardActive(true);
  }

  async function postAnswerRaw(questionId: string, value: string): Promise<boolean> {
    try {
      const res = await fetch("/api/profile/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: value }),
      });
      if (res.ok) {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        return true;
      }
      return false;
    } catch { return false; }
  }

  function advanceWizard() {
    setWizardDraft("");
    setWizardError("");
    const next = wizardIndex + 1;
    if (next >= wizardQueue.length) setWizardDone(true);
    else setWizardIndex(next);
  }

  async function wizardSave() {
    const q = wizardQueue[wizardIndex];
    if (!q || !wizardDraft.trim() || wizardSaving) return;
    setWizardSaving(true);
    setWizardError("");
    const ok = await postAnswerRaw(q.id, wizardDraft.trim());
    setWizardSaving(false);
    if (ok) { setWizardAnsweredCount((n) => n + 1); advanceWizard(); }
    else setWizardError("Failed to save. Please try again.");
  }

  function wizardSkip() {
    setWizardSkipCount((n) => n + 1);
    advanceWizard();
  }

  async function wizardMarkNA() {
    const q = wizardQueue[wizardIndex];
    if (!q || wizardSaving) return;
    setWizardSaving(true);
    const ok = await postAnswerRaw(q.id, NA_VALUE);
    setWizardSaving(false);
    if (ok) { setWizardNACount((n) => n + 1); advanceWizard(); }
    else setWizardError("Failed to save.");
  }

  function closeWizard() {
    setWizardActive(false);
    setWizardDone(false);
    setWizardIndex(0);
    setWizardDraft("");
    setWizardQueue([]);
  }

  // ── Normal accordion functions ───────────────────────────────────────────────
  function toggleCategory(cat: string) { setOpenCategories((p) => ({ ...p, [cat]: !p[cat] })); }
  function toggleHideAnswer(qId: string) {
    setHiddenAnswers((p) => { const n = new Set(p); if (n.has(qId)) n.delete(qId); else n.add(qId); return n; });
  }
  function startEdit(questionId: string) {
    setEditingId(questionId);
    setDraftValue(answers[questionId] === NA_VALUE ? "" : (answers[questionId] ?? ""));
    setErrorId(null);
  }
  function cancelEdit() { setEditingId(null); setDraftValue(""); setErrorId(null); }

  async function saveAnswer(questionId: string, value?: string) {
    if (savingId) return;
    const saveValue = value ?? draftValue;
    if (!saveValue.trim()) return;
    setSavingId(questionId);
    setErrorId(null);
    try {
      const res = await fetch("/api/profile/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: saveValue.trim() }),
      });
      if (res.ok) {
        setAnswers((p) => ({ ...p, [questionId]: saveValue.trim() }));
        setEditingId(null);
        setSavedIds((p) => new Set([...Array.from(p), questionId]));
        setTimeout(() => setSavedIds((p) => { const s = new Set(Array.from(p)); s.delete(questionId); return s; }), 2000);
      } else { setErrorId(questionId); }
    } catch { setErrorId(questionId); }
    finally { setSavingId(null); }
  }

  async function markNA(questionId: string) {
    if (savingId) return;
    setSavingId(questionId);
    setErrorId(null);
    try {
      const res = await fetch("/api/profile/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: NA_VALUE }),
      });
      if (res.ok) { setAnswers((p) => ({ ...p, [questionId]: NA_VALUE })); setEditingId(null); }
      else setErrorId(questionId);
    } catch { setErrorId(questionId); }
    finally { setSavingId(null); }
  }

  async function undoNA(questionId: string) {
    if (savingId) return;
    setSavingId(questionId);
    try {
      const res = await fetch(`/api/profile/answer?questionId=${questionId}`, { method: "DELETE" });
      if (res.ok) setAnswers((p) => ({ ...p, [questionId]: "" }));
    } finally { setSavingId(null); }
  }

  async function addQuestion(category: string, prompt: string) {
    setAddingQ(true); setAddQError("");
    try {
      const res = await fetch("/api/profile/question", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, prompt: prompt.trim(), ownerOnly: newOwnerOnly }),
      });
      if (res.ok) {
        const q = await res.json();
        const newQ: ProfileQuestion = { id: q.id, prompt: q.prompt, category: q.category, ownerOnly: q.ownerOnly, isCustom: true, answer: null };
        setGroups((prev) => {
          const idx = prev.findIndex((g) => g.category === category);
          if (idx >= 0) { const updated = [...prev]; updated[idx] = { ...updated[idx], questions: [...updated[idx].questions, newQ] }; return updated; }
          return [...prev, { category, questions: [newQ] }];
        });
        setAnswers((p) => ({ ...p, [q.id]: "" }));
        setOpenCategories((p) => ({ ...p, [category]: true }));
        setNewPrompt(""); setNewOwnerOnly(false); setAddingCategory(null);
        setShowNewCat(false); setNewCatName(""); setNewCatPrompt("");
      } else { const d = await res.json(); setAddQError(d.error ?? "Failed to add"); }
    } catch { setAddQError("Network error."); }
    finally { setAddingQ(false); }
  }

  async function deleteQuestion(qId: string, category: string) {
    setDeletingId(qId);
    try {
      const res = await fetch(`/api/profile/question/${qId}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((p) => p.map((g) => g.category !== category ? g : { ...g, questions: g.questions.filter((q) => q.id !== qId) }).filter((g) => g.questions.length > 0));
        setAnswers((p) => { const n = { ...p }; delete n[qId]; return n; });
      }
    } finally { setDeletingId(null); }
  }

  async function toggleOwnerOnly(qId: string) {
    const current = ownerOnlyMap[qId] ?? false;
    setTogglingOwnerOnly(qId);
    try {
      const res = await fetch(`/api/profile/question/${qId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerOnly: !current }),
      });
      if (res.ok) setOwnerOnlyMap((p) => ({ ...p, [qId]: !current }));
    } finally { setTogglingOwnerOnly(null); }
  }

  // ── Wizard current question ──────────────────────────────────────────────────
  const wizardQ = !wizardDone && wizardIndex < wizardQueue.length ? wizardQueue[wizardIndex] : null;
  const wizardQCategory = wizardQ
    ? (groups.find((g) => g.questions.some((q) => q.id === wizardQ.id))?.category ?? "")
    : "";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ════════════════════════════════════════════════════════
          WIZARD OVERLAY
      ════════════════════════════════════════════════════════ */}
      {wizardActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4" style={{ backdropFilter: "blur(2px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

            {/* Header */}
            <div className="px-6 py-4 bg-brand-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="font-bold text-sm leading-tight">House Profile Setup</p>
                  <p className="text-xs text-white/50 leading-tight">Answer at your own pace</p>
                </div>
              </div>
              <button onClick={closeWizard} className="text-white/50 hover:text-white transition text-sm flex items-center gap-1 border border-white/20 rounded-lg px-2.5 py-1">
                ✕ Exit
              </button>
            </div>

            {/* ── Done screen ── */}
            {wizardDone ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center overflow-y-auto">
                <span className="text-5xl mb-4">{wizardAnsweredCount > 0 ? "🎉" : "✅"}</span>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {wizardAnsweredCount > 0 ? "Nice work!" : "All done!"}
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">
                  You&apos;ve gone through {wizardQueue.length} question{wizardQueue.length !== 1 ? "s" : ""} in this session.
                </p>

                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {wizardAnsweredCount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-center min-w-[90px]">
                      <p className="text-2xl font-bold text-green-700">{wizardAnsweredCount}</p>
                      <p className="text-xs text-green-600 mt-0.5">Answered</p>
                    </div>
                  )}
                  {wizardNACount > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-center min-w-[90px]">
                      <p className="text-2xl font-bold text-slate-500">{wizardNACount}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Not applicable</p>
                    </div>
                  )}
                  {wizardSkipCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3 text-center min-w-[90px]">
                      <p className="text-2xl font-bold text-amber-600">{wizardSkipCount}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Skipped</p>
                    </div>
                  )}
                </div>

                {wizardSkipCount > 0 && (
                  <p className="text-xs text-slate-400 mb-6 max-w-xs">
                    {wizardSkipCount} skipped question{wizardSkipCount !== 1 ? "s" : ""} will still appear in the sections below — answer them whenever you&apos;re ready.
                  </p>
                )}

                <button onClick={closeWizard} className="btn-primary px-8 py-2.5">
                  View My Profile
                </button>
              </div>

            /* ── Question screen ── */
            ) : wizardQ ? (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Progress bar + counter */}
                <div className="px-6 pt-5 pb-3 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {CATEGORY_ICONS[wizardQCategory] ?? "📋"} {wizardQCategory}
                    </span>
                    <span className="text-xs text-slate-400">
                      {wizardIndex + 1} <span className="text-slate-300">/</span> {wizardQueue.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-brand-600 transition-all duration-400"
                      style={{ width: `${Math.round(((wizardIndex) / wizardQueue.length) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Question body */}
                <div className="px-6 flex-1 overflow-y-auto pb-2">
                  <p className="text-base font-semibold text-slate-900 leading-snug mb-3">
                    {wizardQ.prompt}
                  </p>

                  {wizardQ.ownerOnly && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-3">
                      🔒 <span>Owner only — not shown to your house manager</span>
                    </div>
                  )}

                  <textarea
                    ref={wizardInputRef}
                    value={wizardDraft}
                    onChange={(e) => setWizardDraft(e.target.value)}
                    rows={4}
                    className="input w-full resize-none text-sm"
                    placeholder="Type your answer here…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && wizardDraft.trim()) wizardSave();
                    }}
                  />
                  {wizardError && <p className="text-xs text-red-500 mt-1">{wizardError}</p>}
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 border-t border-slate-100 shrink-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={wizardSave}
                      disabled={!wizardDraft.trim() || wizardSaving}
                      className="btn-primary text-sm px-5 py-2 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {wizardSaving ? (
                        <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                      ) : (
                        <>Save &amp; Continue →</>
                      )}
                    </button>

                    <button
                      onClick={wizardSkip}
                      disabled={wizardSaving}
                      className="btn-secondary text-sm px-4 py-2 text-slate-500"
                    >
                      Skip for now
                    </button>

                    <button
                      onClick={wizardMarkNA}
                      disabled={wizardSaving}
                      className="ml-auto text-sm text-slate-400 hover:text-slate-600 transition"
                      title="This question doesn't apply — it will be hidden from your profile"
                    >
                      ✕ Not applicable
                    </button>
                  </div>

                  {/* Back nav + keyboard hint */}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => {
                        if (wizardIndex > 0) { setWizardIndex((i) => i - 1); setWizardDraft(""); setWizardError(""); }
                      }}
                      disabled={wizardIndex === 0}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30 transition"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-slate-300">⌘↵ to save</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          PROGRESS CARD
      ════════════════════════════════════════════════════════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{totalAnswered} of {totalQuestions} questions answered</span>
          <span className={`text-sm font-bold ${progressPct === 100 ? "text-emerald-600" : "text-brand-600"}`}>{progressPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${progressPct === 100 ? "bg-emerald-500" : "bg-brand-600"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {progressPct === 100 ? (
          <p className="text-xs text-emerald-600 font-medium">🎉 Profile complete!</p>
        ) : canEdit && unansweredCount > 0 ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500">
              {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} remaining — use the wizard to answer them quickly.
            </p>
            <button onClick={launchWizard} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shrink-0">
              🚀 Quick-Start Wizard
            </button>
          </div>
        ) : !canEdit && progressPct < 100 ? (
          <p className="text-xs text-slate-400">
            Ask your owner to fill in the remaining {totalQuestions - totalAnswered} question{totalQuestions - totalAnswered !== 1 ? "s" : ""}.
          </p>
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════════════
          CATEGORY ACCORDIONS
      ════════════════════════════════════════════════════════ */}
      {groups.map((group) => {
        const groupNAqs = group.questions.filter((q) => isNA(q.id));
        const groupVisibleQs = group.questions.filter((q) => !isNA(q.id));
        const answered = groupVisibleQs.filter((q) => isAnswered(q.id)).length;
        const isOpen = !!openCategories[group.category];
        const icon = CATEGORY_ICONS[group.category] ?? "📋";
        const allDone = answered === groupVisibleQs.length && groupVisibleQs.length > 0;
        const showingNA = !!showNAinCat[group.category];
        const displayQs = showingNA ? group.questions : groupVisibleQs;

        return (
          <div key={group.category} className="card overflow-hidden p-0">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg">{icon}</span>
              <span className="flex-1 font-semibold text-slate-800">{group.category}</span>
              {groupNAqs.length > 0 && !showingNA && (
                <span className="text-xs text-slate-300 italic mr-1">{groupNAqs.length} hidden</span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${allDone ? "bg-emerald-100 text-emerald-700" : answered > 0 ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
                {answered}/{groupVisibleQs.length}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {displayQs.map((q) => {
                  const currentAnswer = answers[q.id] ?? "";
                  const isNAq = isNA(q.id);
                  const isEditing = editingId === q.id;
                  const isSaving = savingId === q.id;
                  const wasSaved = savedIds.has(q.id);
                  const hasError = errorId === q.id;
                  const isHidden = hiddenAnswers.has(q.id);
                  const isOwnerOnly = ownerOnlyMap[q.id] ?? q.ownerOnly;
                  const isTogglingThis = togglingOwnerOnly === q.id;

                  return (
                    <div key={q.id} className={`px-5 py-4 ${isEditing ? "bg-slate-50" : ""} ${isNAq ? "bg-slate-50/60" : ""}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <p className={`text-sm font-medium flex-1 leading-snug ${isNAq ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {q.prompt}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* N/A badge + undo */}
                          {isNAq && (
                            <>
                              <span className="text-xs bg-slate-200 text-slate-400 px-2 py-0.5 rounded-full">N/A</span>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => undoNA(q.id)}
                                  disabled={isSaving}
                                  className="text-xs text-brand-600 hover:text-brand-800 font-medium transition disabled:opacity-50"
                                >
                                  {isSaving ? "…" : "Undo"}
                                </button>
                              )}
                            </>
                          )}
                          {/* Owner Only badge */}
                          {isOwnerOnly && !isNAq && <span className="badge badge-slate text-xs">Owner Only</span>}
                          {/* Custom badge */}
                          {q.isCustom && isOwner && !isNAq && <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 font-medium">Custom</span>}
                          {/* Saved confirmation */}
                          {wasSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
                          {/* Hide/show answer toggle */}
                          {canEdit && currentAnswer && !isNAq && !isEditing && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleHideAnswer(q.id); }}
                              className="text-xs text-slate-400 hover:text-slate-600 transition"
                              title={isHidden ? "Show answer" : "Hide answer"}
                            >
                              {isHidden ? "👁 Show" : "🙈 Hide"}
                            </button>
                          )}
                          {/* Owner-only toggle (custom questions) */}
                          {isOwner && q.isCustom && !isEditing && !isNAq && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleOwnerOnly(q.id); }}
                              disabled={isTogglingThis}
                              className={`text-xs px-1.5 py-0.5 rounded border transition disabled:opacity-50 ${isOwnerOnly ? "border-slate-300 text-slate-500 bg-slate-50 hover:bg-slate-100" : "border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100"}`}
                              title={isOwnerOnly ? "Hidden from house manager — click to make visible" : "Visible to house manager — click to hide"}
                            >
                              {isTogglingThis ? "…" : isOwnerOnly ? "Hidden from manager" : "Visible to manager"}
                            </button>
                          )}
                          {/* Edit/Add button */}
                          {canEdit && !isEditing && !isNAq && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); startEdit(q.id); }}
                              className="text-xs text-brand-600 hover:text-brand-800 font-medium transition"
                            >
                              {currentAnswer ? "Edit" : "+ Add"}
                            </button>
                          )}
                          {/* Delete custom question */}
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

                      {/* Edit mode */}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => saveAnswer(q.id)}
                              disabled={isSaving || !draftValue.trim()}
                              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                            >
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                            <button type="button" onClick={cancelEdit} className="btn-secondary text-xs py-1.5 px-3">
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => markNA(q.id)}
                              disabled={isSaving}
                              className="text-xs text-slate-400 hover:text-slate-600 transition ml-1 disabled:opacity-50"
                              title="Mark as not applicable — hides this question from your profile"
                            >
                              ✕ Not applicable
                            </button>
                            <span className="text-xs text-slate-300 ml-auto">⌘↵ to save</span>
                          </div>
                        </div>
                      ) : !isNAq ? (
                        /* Display answer */
                        <div
                          className={`text-sm leading-relaxed ${
                            currentAnswer
                              ? isHidden
                                ? "text-slate-400 italic font-mono tracking-widest select-none"
                                : "text-slate-600"
                              : "text-slate-400 italic"
                          } ${canEdit && !isHidden ? "cursor-pointer hover:text-brand-700 transition-colors" : ""}`}
                          onClick={canEdit && !isHidden ? () => startEdit(q.id) : undefined}
                          title={canEdit && !isHidden ? "Click to edit" : undefined}
                        >
                          {isHidden && currentAnswer ? "••••••••••" : currentAnswer || "No answer yet"}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Toggle N/A questions */}
                {groupNAqs.length > 0 && (
                  <div className="px-5 py-2.5 bg-slate-50/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNAinCat((p) => ({ ...p, [group.category]: !p[group.category] }))}
                      className="text-xs text-slate-400 hover:text-slate-600 transition"
                    >
                      {showingNA
                        ? `▲ Hide ${groupNAqs.length} not-applicable question${groupNAqs.length !== 1 ? "s" : ""}`
                        : `▼ Show ${groupNAqs.length} not-applicable question${groupNAqs.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                )}

                {/* Add custom question */}
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
                          <button type="button" onClick={() => { setAddingCategory(null); setNewPrompt(""); setAddQError(""); }} className="btn-secondary text-xs py-1.5 px-3">
                            Cancel
                          </button>
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

      {/* ════════════════════════════════════════════════════════
          ADD NEW CATEGORY SECTION
      ════════════════════════════════════════════════════════ */}
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
                <button
                  type="button"
                  onClick={() => { setShowNewCat(false); setNewCatName(""); setNewCatPrompt(""); setAddQError(""); }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
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
