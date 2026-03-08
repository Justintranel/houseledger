"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { TaskComment } from "@/types/tasks";

interface Props {
  taskId: string;
  comments: TaskComment[];
  userId: string;
  onCommentAdded: (comment: TaskComment) => void;
}

export default function CommentsThread({ taskId, comments, userId, onCommentAdded }: Props) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (res.ok) {
        const comment = await res.json();
        onCommentAdded(comment as TaskComment);
        setBody("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-400 mb-3">No comments yet.</p>
      ) : (
        <div className="space-y-3 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                {comment.user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2 items-end">
        <textarea
          className="input flex-1 text-sm resize-none"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment… (⌘+Enter to post)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
          className="btn-primary self-end px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}
