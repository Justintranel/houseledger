"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProgressEntry {
  id: string;
  userId: string;
  user: { id: string; name: string };
  completedAt: string;
}

interface AnswerEntry {
  id: string;
  userId: string;
  user: { id: string; name: string };
  answer: string;
  updatedAt: string;
}

interface Question {
  id: string;
  question: string;
  sortOrder: number;
  answers: AnswerEntry[];
}

interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  url: string;
  sortOrder: number;
  progress: ProgressEntry[];
  questions: Question[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
  } catch {}
  return null;
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1];
      if (/^\d+$/.test(id)) return id;
    }
  } catch {}
  return null;
}

function getEmbedUrl(url: string): string | null {
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
  const vimeoId = extractVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
  return null;
}

function detectPlatform(url: string): "youtube" | "vimeo" | "unknown" {
  if (extractYouTubeId(url)) return "youtube";
  if (extractVimeoId(url)) return "vimeo";
  return "unknown";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Platform Badge ───────────────────────────────────────────────────────────
function PlatformBadge({ url }: { url: string }) {
  const platform = detectPlatform(url);
  if (platform === "youtube")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.82 31.82 0 000 12a31.82 31.82 0 00.5 5.81 3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.82 31.82 0 0024 12a31.82 31.82 0 00-.5-5.81zM9.75 15.52V8.48L15.83 12l-6.08 3.52z" />
        </svg>
        YouTube
      </span>
    );
  if (platform === "vimeo")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 12.5C4.603 9.908 3.834 8.61 3.01 8.61c-.179 0-.806.378-1.881 1.132L0 8.477c1.185-1.044 2.351-2.084 3.501-3.128C5.08 3.951 6.266 3.21 7.055 3.14c1.896-.183 3.063 1.112 3.498 3.887.47 2.98.796 4.833.977 5.561.543 2.467 1.139 3.7 1.789 3.7.508 0 1.27-.792 2.287-2.394 1.018-1.602 1.561-2.818 1.626-3.65.145-1.382-.396-2.075-1.627-2.075-.579 0-1.174.132-1.787.396 1.189-3.881 3.454-5.767 6.801-5.658 2.48.073 3.648 1.68 3.36 4.509z" />
        </svg>
        Vimeo
      </span>
    );
  return null;
}

// ─── Manager: Question + Answer Row ──────────────────────────────────────────
function ManagerQuestionRow({
  q,
  videoId,
  userId,
  onAnswerSaved,
}: {
  q: Question;
  videoId: string;
  userId: string;
  onAnswerSaved: () => void;
}) {
  const myAnswer = q.answers.find((a) => a.userId === userId);
  const [text, setText] = useState(myAnswer?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/training/${videoId}/questions/${q.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: text.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onAnswerSaved();
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium text-slate-800">{q.question}</p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={3}
        className="input w-full resize-none text-sm"
        placeholder="Type your answer here…"
      />
      <div className="flex items-center justify-between">
        {myAnswer ? (
          <span className="text-xs text-slate-400">Last saved {formatDate(myAnswer.updatedAt)}</span>
        ) : (
          <span className="text-xs text-amber-500 font-medium">⚠ Not yet answered</span>
        )}
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="btn-primary text-xs px-3 py-1.5"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : myAnswer ? "Update Answer" : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}

// ─── Owner: Question Management Row ──────────────────────────────────────────
function OwnerQuestionRow({
  q,
  videoId,
  onDeleted,
  onUpdated,
}: {
  q: Question;
  videoId: string;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(q.question);
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/training/${videoId}/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: editText.trim() }),
    });
    setSaving(false);
    if (res.ok) { setEditing(false); onUpdated(); }
  }

  async function deleteQ() {
    if (!confirm("Delete this question and all answers?")) return;
    await fetch(`/api/training/${videoId}/questions/${q.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Question */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            className="input w-full resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-slate-800 flex-1">{q.question}</p>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
              title="Edit question"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={deleteQ}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Delete question"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Answers from managers */}
      {q.answers.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            House Manager Answers ({q.answers.length})
          </p>
          {q.answers.map((a) => (
            <div key={a.id} className="bg-slate-50 rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{a.user.name}</span>
                <span className="text-xs text-slate-400">{formatDate(a.updatedAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.answer}</p>
            </div>
          ))}
        </div>
      )}

      {q.answers.length === 0 && (
        <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-100">
          No answers yet from house managers.
        </p>
      )}
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({
  video,
  index,
  canWrite,
  currentUserId,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRefresh,
  isFirst,
  isLast,
}: {
  video: TrainingVideo;
  index: number;
  canWrite: boolean;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRefresh: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [addingQ, setAddingQ] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [markingWatched, setMarkingWatched] = useState(false);

  const embedUrl = getEmbedUrl(video.url);
  const myProgress = video.progress.find((p) => p.userId === currentUserId);
  const isWatched = !!myProgress;

  // For manager: count answered questions
  const myAnsweredCount = video.questions.filter(
    (q) => q.answers.some((a) => a.userId === currentUserId)
  ).length;

  async function toggleWatched() {
    setMarkingWatched(true);
    if (isWatched) {
      await fetch(`/api/training/${video.id}/complete`, { method: "DELETE" });
    } else {
      await fetch(`/api/training/${video.id}/complete`, { method: "POST" });
    }
    setMarkingWatched(false);
    onRefresh();
  }

  async function addQuestion() {
    if (!newQuestion.trim()) return;
    setAddingQ(true);
    const res = await fetch(`/api/training/${video.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion.trim() }),
    });
    setAddingQ(false);
    if (res.ok) {
      setNewQuestion("");
      setShowAddQ(false);
      onRefresh();
    }
  }

  return (
    <div className={`card overflow-hidden transition ${isWatched && !canWrite ? "ring-2 ring-green-400/40" : ""}`}>
      {/* ── Header row ── */}
      <div className="flex items-start gap-4 p-5">
        {/* Module number + watched badge */}
        <div className="shrink-0 flex flex-col items-center gap-1 mt-0.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            isWatched ? "bg-green-500 text-white" : "bg-brand-600 text-white"
          }`}>
            {isWatched ? "✓" : index + 1}
          </div>
          {isWatched && (
            <span className="text-xs font-semibold text-green-600 whitespace-nowrap">Watched</span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-base leading-snug">{video.title}</h3>
          {video.description && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{video.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <PlatformBadge url={video.url} />

            {/* Progress pill (owner view) */}
            {canWrite && video.progress.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                👁 {video.progress.length} watched
              </span>
            )}

            {/* Questions pill */}
            {video.questions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                ❓ {canWrite
                  ? `${video.questions.length} question${video.questions.length !== 1 ? "s" : ""}`
                  : `${myAnsweredCount}/${video.questions.length} answered`}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
          {canWrite && (
            <>
              <button onClick={onMoveUp} disabled={isFirst}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition" title="Move up">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button onClick={onMoveDown} disabled={isLast}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition" title="Move down">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button onClick={onEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition" title="Edit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={onDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              open ? "bg-slate-100 text-slate-600" : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {open ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>Close</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>Watch</>
            )}
          </button>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-slate-100">
          {/* Video player */}
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe src={embedUrl} title={video.title} className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen />
            </div>
          ) : (
            <div className="p-5 text-center text-slate-500">
              <p className="text-sm">
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                  Open video in new tab →
                </a>
              </p>
            </div>
          )}

          {/* ── MANAGER: Mark watched + Test questions ── */}
          {!canWrite && (
            <div className="p-5 space-y-5 bg-slate-50/50">
              {/* Mark watched button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {isWatched ? "✅ You watched this on " + formatDate(myProgress!.completedAt) : "Have you finished watching?"}
                  </p>
                  {!isWatched && (
                    <p className="text-xs text-slate-400 mt-0.5">Mark as watched once you've finished the video.</p>
                  )}
                </div>
                <button
                  onClick={toggleWatched}
                  disabled={markingWatched}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isWatched
                      ? "bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {markingWatched ? "…" : isWatched ? "✓ Watched — Unmark" : "✓ Mark as Watched"}
                </button>
              </div>

              {/* Test questions */}
              {video.questions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">📝 Test Questions</p>
                    <span className="text-xs text-slate-400">
                      {myAnsweredCount}/{video.questions.length} answered
                    </span>
                  </div>
                  {video.questions.map((q) => (
                    <ManagerQuestionRow
                      key={q.id}
                      q={q}
                      videoId={video.id}
                      userId={currentUserId}
                      onAnswerSaved={onRefresh}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── OWNER: Progress + Question management ── */}
          {canWrite && (
            <div className="p-5 space-y-5 bg-slate-50/50">
              {/* Progress section */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  👥 House Manager Progress
                </p>
                {video.progress.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No one has watched this yet.</p>
                ) : (
                  <div className="space-y-2">
                    {video.progress.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                            {p.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{p.user.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">Watched {formatDate(p.completedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Test questions section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ❓ Test Questions ({video.questions.length})
                  </p>
                  <button
                    onClick={() => setShowAddQ((v) => !v)}
                    className="text-xs text-brand-600 hover:underline font-medium"
                  >
                    {showAddQ ? "Cancel" : "+ Add Question"}
                  </button>
                </div>

                {/* Add question form */}
                {showAddQ && (
                  <div className="mb-3 space-y-2">
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={2}
                      className="input w-full resize-none text-sm"
                      placeholder="e.g. What is the correct order for cleaning the kitchen?"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addQuestion}
                        disabled={addingQ || !newQuestion.trim()}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {addingQ ? "Adding…" : "Add Question"}
                      </button>
                      <button onClick={() => { setShowAddQ(false); setNewQuestion(""); }}
                        className="btn-secondary text-xs px-3 py-1.5">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {video.questions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    No test questions yet. Add questions to verify your house manager understood the video.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {video.questions.map((q) => (
                      <OwnerQuestionRow
                        key={q.id}
                        q={q}
                        videoId={video.id}
                        onDeleted={onRefresh}
                        onUpdated={onRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Owner: Per-Manager Status Panel ─────────────────────────────────────────
function ManagerStatusPanel({ videos }: { videos: TrainingVideo[] }) {
  const [expanded, setExpanded] = useState(true);

  const totalVideos = videos.length;
  const totalQuestions = videos.reduce((s, v) => s + v.questions.length, 0);

  // Build per-manager stats from progress + answer data already loaded
  const managerMap = new Map<string, { id: string; name: string; watched: number; answered: number }>();

  for (const video of videos) {
    for (const p of video.progress) {
      if (!managerMap.has(p.userId)) {
        managerMap.set(p.userId, { id: p.userId, name: p.user.name, watched: 0, answered: 0 });
      }
      managerMap.get(p.userId)!.watched++;
    }
    for (const q of video.questions) {
      for (const a of q.answers) {
        if (!managerMap.has(a.userId)) {
          managerMap.set(a.userId, { id: a.userId, name: a.user.name, watched: 0, answered: 0 });
        }
        managerMap.get(a.userId)!.answered++;
      }
    }
  }

  const managers = Array.from(managerMap.values()).sort(
    (a, b) => b.watched - a.watched || b.answered - a.answered
  );

  if (managers.length === 0) return null;

  return (
    <div className="card mb-5 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold text-slate-800">👥 House Manager Status</span>
          <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
            {managers.length} house manager{managers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {managers.map((m) => {
            const watchPct = totalVideos > 0 ? (m.watched / totalVideos) * 100 : 0;
            const answerPct = totalQuestions > 0 ? (m.answered / totalQuestions) * 100 : 0;
            const status =
              m.watched === totalVideos && (totalQuestions === 0 || m.answered === totalQuestions)
                ? "complete"
                : m.watched > 0 || m.answered > 0
                ? "in-progress"
                : "not-started";

            return (
              <div key={m.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{m.name}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      status === "complete"
                        ? "bg-green-100 text-green-700"
                        : status === "in-progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {status === "complete" ? "✓ Complete" : status === "in-progress" ? "In progress" : "Not started"}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Videos watched bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Videos watched</span>
                      <span className="font-semibold text-slate-700">{m.watched}/{totalVideos}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${watchPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Questions answered bar */}
                  {totalQuestions > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Questions answered</span>
                        <span className="font-semibold text-slate-700">{m.answered}/{totalQuestions}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-500"
                          style={{ width: `${answerPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function VideoModal({
  editVideo,
  onClose,
  onSaved,
}: {
  editVideo: TrainingVideo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editVideo?.title ?? "");
  const [description, setDescription] = useState(editVideo?.description ?? "");
  const [url, setUrl] = useState(editVideo?.url ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim(),
      };
      const endpoint = editVideo ? `/api/training/${editVideo.id}` : "/api/training";
      const method = editVideo ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const d = await res.json(); setError(d.error ?? "Failed to save."); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-lg">
            {editVideo ? "Edit Training Video" : "Add Training Video"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Module Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="input w-full" required placeholder="e.g. Morning Cleaning Routine" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} className="input w-full resize-none" placeholder="Briefly describe what this video covers…" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600">YouTube or Vimeo URL *</label>
              <button type="button" onClick={() => setShowHowTo((v) => !v)}
                className="text-xs text-brand-600 hover:underline font-medium">
                {showHowTo ? "Hide ▲" : "How do I get the link? ▼"}
              </button>
            </div>
            {showHowTo && (
              <div className="mb-3 bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-brand-700 mb-2">🎬 YouTube</p>
                  <ol className="space-y-1 list-none">
                    {["Open YouTube and find the video.", 'Click "Share" below the video.', 'Click "Copy Link".', "Paste it below."].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="border-t border-brand-100 pt-3">
                  <p className="font-semibold text-brand-700 mb-2">🎞 Vimeo</p>
                  <ol className="space-y-1 list-none">
                    {["Open Vimeo and find your video.", "Click the share icon on the video.", 'Copy the "Video Link".', "Paste it below."].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              className="input w-full" required
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..." />
            {url && (
              <p className={`text-xs mt-1.5 font-medium ${getEmbedUrl(url) ? "text-green-600" : "text-amber-600"}`}>
                {getEmbedUrl(url)
                  ? `✓ ${detectPlatform(url) === "youtube" ? "YouTube" : "Vimeo"} video detected — will embed automatically.`
                  : "⚠ Not recognized. Will open in a new tab instead."}
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Saving…" : editVideo ? "Save Changes" : "Add Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const currentUserId = (session?.user as any)?.id as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVideo, setEditVideo] = useState<TrainingVideo | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/training");
      if (res.ok) setVideos(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  function openAdd() { setEditVideo(null); setShowModal(true); }
  function openEdit(v: TrainingVideo) { setEditVideo(v); setShowModal(true); }

  async function deleteVideo(id: string) {
    if (!confirm("Remove this training video?")) return;
    await fetch(`/api/training/${id}`, { method: "DELETE" });
    await fetchVideos();
  }

  async function moveVideo(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= videos.length) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[swapIndex]] = [newVideos[swapIndex], newVideos[index]];
    setVideos(newVideos);
    await Promise.all(
      newVideos.map((v, i) =>
        fetch(`/api/training/${v.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        })
      )
    );
  }

  // Summary stats for owner
  const totalWatched = videos.filter((v) => v.progress.length > 0).length;
  const totalQuestions = videos.reduce((sum, v) => sum + v.questions.length, 0);
  const totalAnswers = videos.reduce((sum, v) =>
    sum + v.questions.reduce((qs, q) => qs + q.answers.length, 0), 0
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Videos 🎓</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {canWrite
              ? "Build a training course for your house manager with YouTube or Vimeo videos."
              : "Complete these training modules and answer the test questions."}
          </p>
        </div>
        {canWrite && (
          <button onClick={openAdd} className="btn-primary text-sm">+ Add Module</button>
        )}
      </div>

      {/* Owner stats bar */}
      {canWrite && videos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Modules", value: videos.length, icon: "🎬" },
            { label: "Watched", value: `${totalWatched}/${videos.length}`, icon: "👁" },
            { label: "Q&A Responses", value: `${totalAnswers}/${totalQuestions}`, icon: "✍️" },
          ].map((stat) => (
            <div key={stat.label} className="card px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-none">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-manager status panel (owner only) */}
      {canWrite && videos.length > 0 && (
        <ManagerStatusPanel videos={videos} />
      )}

      {/* Manager banner */}
      {!canWrite && videos.length > 0 && (
        <div className="mb-5 bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 flex items-center gap-4">
          <span className="text-3xl">📚</span>
          <div>
            <p className="font-semibold text-brand-800 text-sm">
              {videos.length} Training Module{videos.length !== 1 ? "s" : ""}
              {totalQuestions > 0 && ` · ${totalQuestions} Test Question${totalQuestions !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              Watch each module, mark it as watched, and answer any test questions.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading training videos…</p>
      ) : videos.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">🎬</p>
          <p className="font-semibold text-slate-600 text-lg">No training videos yet.</p>
          {canWrite ? (
            <>
              <p className="text-sm mt-1 text-slate-400">Add YouTube or Vimeo links to build a training course.</p>
              <button onClick={openAdd} className="mt-5 btn-primary text-sm">Add Your First Training Module →</button>
            </>
          ) : (
            <p className="text-sm mt-1 text-slate-400">Your owner hasn&apos;t added any training videos yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              index={i}
              canWrite={canWrite}
              currentUserId={currentUserId ?? ""}
              onEdit={() => openEdit(video)}
              onDelete={() => deleteVideo(video.id)}
              onMoveUp={() => moveVideo(i, "up")}
              onMoveDown={() => moveVideo(i, "down")}
              onRefresh={fetchVideos}
              isFirst={i === 0}
              isLast={i === videos.length - 1}
            />
          ))}
        </div>
      )}

      {showModal && (
        <VideoModal
          editVideo={editVideo}
          onClose={() => setShowModal(false)}
          onSaved={fetchVideos}
        />
      )}
    </div>
  );
}
