"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

const PERFORMANCE_CATEGORIES = [
  { key: "reliability",      label: "Reliability" },
  { key: "communication",    label: "Communication" },
  { key: "attention_detail", label: "Attention to Detail" },
  { key: "cleaning_quality", label: "Cleaning / Housekeeping" },
  { key: "organization",    label: "Organization" },
  { key: "time_management", label: "Time Management" },
  { key: "sop_compliance",  label: "SOP Compliance" },
  { key: "proactiveness",   label: "Proactiveness" },
  { key: "professionalism", label: "Professionalism" },
  { key: "trustworthiness", label: "Trustworthiness" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CategoryScore {
  categoryKey: string;
  rating: number;
  comment?: string | null;
}

interface Review {
  id: string;
  reviewMonth: number;
  reviewYear: number;
  reviewer: { id: string; name: string };
  overallRating: number | null;
  strengths: string | null;
  improvementAreas: string | null;
  generalComments: string | null;
  goalsNextMonth: string | null;
  status: "SUBMITTED";
  submittedAt: string | null;
  categoryScores: CategoryScore[];
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`text-lg ${n <= value ? "text-amber-400" : "text-slate-200"}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function MiniStars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`text-sm ${n <= value ? "text-amber-400" : "text-slate-200"}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatSubmittedDate(submittedAt: string | null): string {
  if (!submittedAt) return "Unknown date";
  return format(new Date(submittedAt), "MMM d, yyyy");
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Performance Reviews</h1>
        <p className="text-slate-500 text-sm mt-0.5">See feedback from your house manager</p>
      </div>

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-medium text-slate-600">No performance reviews yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Your house manager hasn&apos;t submitted a review for you yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const scoreMap = Object.fromEntries(
              review.categoryScores.map((s) => [s.categoryKey, s.rating])
            );
            return (
              <div key={review.id} className="card p-5">
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {formatMonthYear(review.reviewMonth, review.reviewYear)}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Reviewed by: {review.reviewer.name}
                      {review.submittedAt && (
                        <span className="text-slate-400"> · Submitted {formatSubmittedDate(review.submittedAt)}</span>
                      )}
                    </p>
                  </div>
                  {review.overallRating != null && (
                    <div className="flex flex-col items-end gap-0.5 ml-4 shrink-0">
                      <p className="text-xs text-slate-400">Overall</p>
                      <Stars value={review.overallRating} />
                    </div>
                  )}
                </div>

                {/* Mini category scores row */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 py-3 border-t border-b border-slate-100">
                  {PERFORMANCE_CATEGORIES.map((cat) => {
                    const rating = scoreMap[cat.key];
                    if (rating == null) return null;
                    return (
                      <div key={cat.key} className="flex items-center gap-1.5">
                        <MiniStars value={rating} />
                        <span className="text-xs text-slate-500 whitespace-nowrap">{rating}</span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* View button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="text-sm text-brand-600 font-medium hover:text-brand-700 px-4 py-1.5 rounded-lg hover:bg-brand-50 transition"
                  >
                    View Full Review →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-xl text-slate-900">
                  {formatMonthYear(selectedReview.reviewMonth, selectedReview.reviewYear)}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Reviewed by: {selectedReview.reviewer.name}
                  {selectedReview.submittedAt && (
                    <span className="text-slate-400"> · {formatSubmittedDate(selectedReview.submittedAt)}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-slate-400 hover:text-slate-600 ml-4 mt-0.5 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Overall rating */}
              {selectedReview.overallRating != null && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">Overall Rating</span>
                  <Stars value={selectedReview.overallRating} />
                  <span className="text-sm text-slate-500">{selectedReview.overallRating} / 5</span>
                </div>
              )}

              {/* Performance by Category */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Performance by Category
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERFORMANCE_CATEGORIES.map((cat) => {
                    const score = selectedReview.categoryScores.find(
                      (s) => s.categoryKey === cat.key
                    );
                    return (
                      <div key={cat.key} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700">{cat.label}</span>
                          {score != null ? (
                            <Stars value={score.rating} />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not rated</span>
                          )}
                        </div>
                        {score?.comment && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{score.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback section */}
              {(selectedReview.strengths ||
                selectedReview.improvementAreas ||
                selectedReview.generalComments ||
                selectedReview.goalsNextMonth) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Feedback
                  </p>
                  <div className="space-y-3">
                    {selectedReview.strengths && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Strengths</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedReview.strengths}
                        </p>
                      </div>
                    )}
                    {selectedReview.improvementAreas && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Areas for Improvement</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedReview.improvementAreas}
                        </p>
                      </div>
                    )}
                    {selectedReview.generalComments && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">General Comments</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedReview.generalComments}
                        </p>
                      </div>
                    )}
                    {selectedReview.goalsNextMonth && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Goals for Next Month</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedReview.goalsNextMonth}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
