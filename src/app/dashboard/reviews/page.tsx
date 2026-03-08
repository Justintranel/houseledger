"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// ─── Shared constant ────────────────────────────────────────────────────────
const PERFORMANCE_CATEGORIES = [
  { key: "reliability",      label: "Reliability" },
  { key: "communication",    label: "Communication" },
  { key: "attention_detail", label: "Attention to Detail" },
  { key: "cleaning_quality", label: "Cleaning / Housekeeping" },
  { key: "organization",     label: "Organization" },
  { key: "time_management",  label: "Time Management" },
  { key: "sop_compliance",   label: "SOP Compliance" },
  { key: "proactiveness",    label: "Proactiveness" },
  { key: "professionalism",  label: "Professionalism" },
  { key: "trustworthiness",  label: "Trustworthiness" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface CategoryScore {
  categoryKey: string;
  rating: number;
  comment?: string;
}

interface Review {
  id: string;
  revieweeId: string;
  reviewee: { id: string; name: string };
  reviewer: { id: string; name: string };
  reviewMonth: number;
  reviewYear: number;
  overallRating: number | null;
  strengths: string | null;
  improvementAreas: string | null;
  generalComments: string | null;
  goalsNextMonth: string | null;
  status: "DRAFT" | "SUBMITTED";
  submittedAt: string | null;
  categoryScores: CategoryScore[];
}

interface Manager {
  id: string;
  name: string;
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (n: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-xl ${n <= value ? "text-amber-400" : "text-slate-200"} ${
            readonly ? "cursor-default" : "hover:text-amber-300 transition"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Close Icon ───────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const canWrite = role === "OWNER" || role === "FAMILY";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // ── List state ──
  const [reviews, setReviews] = useState<Review[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [editReview, setEditReview] = useState<Review | null>(null);

  // ── Form fields ──
  const [fManagerId, setFManagerId] = useState("");
  const [fMonth, setFMonth] = useState(currentMonth);
  const [fYear, setFYear] = useState(currentYear);
  const [fOverallRating, setFOverallRating] = useState(0);
  const [fStrengths, setFStrengths] = useState("");
  const [fImprovements, setFImprovements] = useState("");
  const [fComments, setFComments] = useState("");
  const [fGoals, setFGoals] = useState("");
  const [fCategoryScores, setFCategoryScores] = useState<Record<string, { rating: number; comment: string }>>({});
  const [fError, setFError] = useState("");

  // ── Action state ──
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchManagers() {
    const res = await fetch("/api/reviews/managers");
    if (res.ok) setManagers(await res.json());
  }

  useEffect(() => {
    fetchReviews();
    fetchManagers();
  }, []);

  // ── Form helpers ────────────────────────────────────────────────────────────
  function buildDefaultCategoryScores(): Record<string, { rating: number; comment: string }> {
    const scores: Record<string, { rating: number; comment: string }> = {};
    for (const cat of PERFORMANCE_CATEGORIES) {
      scores[cat.key] = { rating: 0, comment: "" };
    }
    return scores;
  }

  function openAdd() {
    setEditReview(null);
    setFManagerId(managers[0]?.id ?? "");
    setFMonth(currentMonth);
    setFYear(currentYear);
    setFOverallRating(0);
    setFStrengths("");
    setFImprovements("");
    setFComments("");
    setFGoals("");
    setFCategoryScores(buildDefaultCategoryScores());
    setFError("");
    setShowModal(true);
  }

  function openEdit(r: Review) {
    setEditReview(r);
    setFManagerId(r.revieweeId);
    setFMonth(r.reviewMonth);
    setFYear(r.reviewYear);
    setFOverallRating(r.overallRating ?? 0);
    setFStrengths(r.strengths ?? "");
    setFImprovements(r.improvementAreas ?? "");
    setFComments(r.generalComments ?? "");
    setFGoals(r.goalsNextMonth ?? "");

    const scores = buildDefaultCategoryScores();
    for (const cs of r.categoryScores) {
      scores[cs.categoryKey] = { rating: cs.rating, comment: cs.comment ?? "" };
    }
    setFCategoryScores(scores);
    setFError("");
    setShowModal(true);
  }

  function setCategoryRating(key: string, rating: number) {
    setFCategoryScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], rating },
    }));
  }

  function setCategoryComment(key: string, comment: string) {
    setFCategoryScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], comment },
    }));
  }

  // ── Required-fields check for submit ──────────────────────────────────────
  function allRequiredFilled(): boolean {
    if (!fManagerId) return false;
    if (fOverallRating === 0) return false;
    for (const cat of PERFORMANCE_CATEGORIES) {
      if ((fCategoryScores[cat.key]?.rating ?? 0) === 0) return false;
    }
    return true;
  }

  // ── API actions ─────────────────────────────────────────────────────────────
  async function submitForm(isDraft: boolean) {
    setFError("");
    setSubmitting(true);
    try {
      // Only include scores that have been rated (rating > 0).
      // This is important for drafts where the user hasn't filled all categories yet.
      const categoryScoresPayload = PERFORMANCE_CATEGORIES
        .map((cat) => ({
          categoryKey: cat.key,
          rating: fCategoryScores[cat.key]?.rating ?? 0,
          comment: fCategoryScores[cat.key]?.comment?.trim() || undefined,
        }))
        .filter((s) => s.rating > 0);

      const body: Record<string, unknown> = {
        revieweeId: fManagerId,
        reviewMonth: fMonth,
        reviewYear: fYear,
        overallRating: fOverallRating || undefined,
        strengths: fStrengths.trim() || undefined,
        improvementAreas: fImprovements.trim() || undefined,
        generalComments: fComments.trim() || undefined,
        goalsNextMonth: fGoals.trim() || undefined,
        categoryScores: categoryScoresPayload,
        status: isDraft ? "DRAFT" : "SUBMITTED",
      };

      const url = editReview ? `/api/reviews/${editReview.id}` : "/api/reviews";
      const method = editReview ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchReviews();
      } else {
        const data = await res.json();
        setFError(data.error ?? "Failed to save review.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview(id: string) {
    if (!confirm("Submit this review? Once submitted it cannot be edited.")) return;
    const res = await fetch(`/api/reviews/${id}/submit`, { method: "POST" });
    if (res.ok) await fetchReviews();
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this draft review? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) await fetchReviews();
    } finally {
      setDeleting(null);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function formatMonthYear(month: number, year: number): string {
    return `${MONTHS[month - 1]} ${year}`;
  }

  function formatSubmittedDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Reviews</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track and document your house manager&apos;s monthly performance.
          </p>
        </div>
        {canWrite && (
          <button onClick={openAdd} className="btn-primary text-sm">
            + New Performance Review
          </button>
        )}
      </div>

      {/* ── Review List ── */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-semibold text-slate-600 text-lg">No performance reviews yet.</p>
          <p className="text-sm mt-1 text-slate-400">
            Write your first performance review to give feedback to your house manager.
          </p>
          {canWrite && (
            <button onClick={openAdd} className="mt-5 btn-primary text-sm">
              Write Your First Performance Review →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              canWrite={canWrite}
              deleting={deleting}
              onView={() => setViewReview(r)}
              onEdit={() => openEdit(r)}
              onSubmit={() => submitReview(r.id)}
              onDelete={() => deleteReview(r.id)}
              formatMonthYear={formatMonthYear}
            />
          ))}
        </div>
      )}

      {/* ── View Detail Modal ── */}
      {viewReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  {viewReview.reviewee.name}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatMonthYear(viewReview.reviewMonth, viewReview.reviewYear)}
                  {viewReview.submittedAt && (
                    <span className="ml-2 text-slate-400">
                      · Submitted {formatSubmittedDate(viewReview.submittedAt)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setViewReview(null)}
                className="text-slate-400 hover:text-slate-600 ml-4 mt-0.5 shrink-0"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Status + Overall */}
              <div className="flex items-center gap-4">
                <span className={viewReview.status === "SUBMITTED" ? "badge-green" : "badge-yellow"}>
                  {viewReview.status === "SUBMITTED" ? "Submitted" : "Draft"}
                </span>
                {viewReview.overallRating != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Overall
                    </span>
                    <StarRating value={viewReview.overallRating} readonly />
                    <span className="text-sm font-semibold text-slate-700">
                      {viewReview.overallRating}/5
                    </span>
                  </div>
                )}
              </div>

              {/* Category Scores */}
              {viewReview.categoryScores.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Performance Categories
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERFORMANCE_CATEGORIES.map((cat) => {
                      const cs = viewReview.categoryScores.find(
                        (s) => s.categoryKey === cat.key
                      );
                      if (!cs) return null;
                      return (
                        <div
                          key={cat.key}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-100"
                        >
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            {cat.label}
                          </p>
                          <StarRating value={cs.rating} readonly />
                          {cs.comment && (
                            <p className="text-xs text-slate-500 mt-1.5 italic">
                              &ldquo;{cs.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Written Feedback */}
              {(viewReview.strengths ||
                viewReview.improvementAreas ||
                viewReview.generalComments ||
                viewReview.goalsNextMonth) && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Written Feedback
                  </p>
                  {viewReview.strengths && (
                    <FeedbackBlock label="Strengths" text={viewReview.strengths} />
                  )}
                  {viewReview.improvementAreas && (
                    <FeedbackBlock
                      label="Areas for Improvement"
                      text={viewReview.improvementAreas}
                    />
                  )}
                  {viewReview.generalComments && (
                    <FeedbackBlock
                      label="General Comments"
                      text={viewReview.generalComments}
                    />
                  )}
                  {viewReview.goalsNextMonth && (
                    <FeedbackBlock
                      label="Goals for Next Month"
                      text={viewReview.goalsNextMonth}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => setViewReview(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="font-semibold text-slate-800 text-lg">
                {editReview ? "Edit Performance Review" : "New Performance Review"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 py-5 space-y-7">
              {/* ── Section 1: Who / When ── */}
              <section className="space-y-4">
                <SectionHeading>Review Details</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      House Manager *
                    </label>
                    <select
                      value={fManagerId}
                      onChange={(e) => setFManagerId(e.target.value)}
                      className="input w-full"
                      required
                    >
                      {managers.length === 0 && (
                        <option value="">No house managers found</option>
                      )}
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Month *
                    </label>
                    <select
                      value={fMonth}
                      onChange={(e) => setFMonth(Number(e.target.value))}
                      className="input w-full"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={fYear}
                      onChange={(e) => setFYear(Number(e.target.value))}
                      className="input w-full"
                      min={2020}
                      max={2099}
                    />
                  </div>
                </div>
              </section>

              {/* ── Section 2: Overall Rating ── */}
              <section className="space-y-3">
                <SectionHeading>Overall Rating</SectionHeading>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                  <StarRating value={fOverallRating} onChange={setFOverallRating} />
                  <span className="text-sm text-slate-500">
                    {fOverallRating === 0
                      ? "Click to rate"
                      : `${fOverallRating} out of 5`}
                  </span>
                </div>
              </section>

              {/* ── Section 3: Performance Categories ── */}
              <section className="space-y-3">
                <SectionHeading>Performance Categories</SectionHeading>
                <p className="text-xs text-slate-400 -mt-1">
                  Rate each category (required) and optionally add a comment.
                </p>
                <div className="space-y-3">
                  {PERFORMANCE_CATEGORIES.map((cat) => {
                    const score = fCategoryScores[cat.key] ?? { rating: 0, comment: "" };
                    return (
                      <div
                        key={cat.key}
                        className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-700">
                            {cat.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <StarRating
                              value={score.rating}
                              onChange={(n) => setCategoryRating(cat.key, n)}
                            />
                            {score.rating > 0 && (
                              <span className="text-xs text-slate-400 w-6 text-right">
                                {score.rating}/5
                              </span>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={score.comment}
                          onChange={(e) => setCategoryComment(cat.key, e.target.value)}
                          rows={2}
                          className="input w-full resize-none text-xs"
                          placeholder="Optional comment…"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Section 4: Written Feedback ── */}
              <section className="space-y-4">
                <SectionHeading>Written Feedback</SectionHeading>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Strengths
                  </label>
                  <textarea
                    value={fStrengths}
                    onChange={(e) => setFStrengths(e.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="What did they do really well this month?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={fImprovements}
                    onChange={(e) => setFImprovements(e.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Where could they improve?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    General Comments
                  </label>
                  <textarea
                    value={fComments}
                    onChange={(e) => setFComments(e.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Any other notes or observations…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Goals for Next Month
                  </label>
                  <textarea
                    value={fGoals}
                    onChange={(e) => setFGoals(e.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="What should they focus on next month?"
                  />
                </div>
              </section>

              {/* ── Error ── */}
              {fError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 border border-red-100">
                  {fError}
                </p>
              )}
            </div>

            {/* ── Footer Buttons ── */}
            <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0 bg-white rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => submitForm(true)}
                  disabled={submitting || !fManagerId}
                  className="btn-secondary text-sm"
                >
                  {submitting ? "Saving…" : "Save as Draft"}
                </button>
                {allRequiredFilled() && (
                  <button
                    type="button"
                    onClick={() => submitForm(false)}
                    disabled={submitting}
                    className="btn-primary text-sm"
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
      {children}
    </h3>
  );
}

function FeedbackBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap border border-slate-100">
        {text}
      </p>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  canWrite: boolean;
  deleting: string | null;
  onView: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  formatMonthYear: (month: number, year: number) => string;
}

function ReviewCard({
  review,
  canWrite,
  deleting,
  onView,
  onEdit,
  onSubmit,
  onDelete,
  formatMonthYear,
}: ReviewCardProps) {
  const isDraft = review.status === "DRAFT";
  const hasOverall = review.overallRating != null && review.overallRating > 0;
  const avgCatRating =
    review.categoryScores.length > 0
      ? review.categoryScores.reduce((s, c) => s + c.rating, 0) /
        review.categoryScores.length
      : null;

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
            {review.reviewee.name}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatMonthYear(review.reviewMonth, review.reviewYear)}
          </p>
        </div>
        <span
          className={`ml-3 shrink-0 ${isDraft ? "badge-yellow" : "badge-green"}`}
        >
          {isDraft ? "Draft" : "Submitted"}
        </span>
      </div>

      {/* Rating row */}
      {hasOverall && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`text-lg ${n <= (review.overallRating ?? 0) ? "text-amber-400" : "text-slate-200"}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium">Overall</span>
        </div>
      )}

      {/* Category average pill */}
      {avgCatRating !== null && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(avgCatRating / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {avgCatRating.toFixed(1)} avg
          </span>
        </div>
      )}

      {/* Category count */}
      {review.categoryScores.length > 0 && (
        <p className="text-xs text-slate-400">
          {review.categoryScores.length} of {PERFORMANCE_CATEGORIES.length} categories rated
        </p>
      )}

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
        <button
          onClick={onView}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          View
        </button>
        {canWrite && isDraft && (
          <>
            <button
              onClick={onEdit}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Edit
            </button>
            {hasOverall && (
              <button
                onClick={onSubmit}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Submit
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={deleting === review.id}
              className="ml-auto text-xs text-red-500 font-medium hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting === review.id ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
