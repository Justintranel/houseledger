"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type ApprovalStatus = "PENDING" | "APPROVED" | "DENIED";

interface Receipt {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface PurchaseRequest {
  id: string;
  amount: number;
  vendor: string;
  category: string | null;
  reason: string;
  neededBy: string | null;
  status: ApprovalStatus;
  createdAt: string;
  requester: { id: string; name: string };
  approver: { id: string; name: string } | null;
  denialReason: string | null;
  receipts: Receipt[];
}

const STATUS_BADGE: Record<ApprovalStatus, string> = {
  PENDING: "badge badge-yellow",
  APPROVED: "badge badge-green",
  DENIED: "badge badge-red",
};

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  const [tab, setTab] = useState<"requests" | "mine">("requests");
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [denyId, setDenyId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [denySubmitting, setDenySubmitting] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);

  // Receipt upload state per request
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // New request form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newVendor, setNewVendor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newNeededBy, setNewNeededBy] = useState("");
  const [newSubmitting, setNewSubmitting] = useState(false);
  const [newError, setNewError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/approvals");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function approve(id: string) {
    setActionSubmitting(id);
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, { method: "POST" });
      if (res.ok) fetchRequests();
    } finally {
      setActionSubmitting(null);
    }
  }

  async function submitDeny(e: React.FormEvent) {
    e.preventDefault();
    if (!denyId) return;
    setDenySubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${denyId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: denyReason }),
      });
      if (res.ok) {
        setDenyId(null);
        setDenyReason("");
        fetchRequests();
      }
    } finally {
      setDenySubmitting(false);
    }
  }

  async function submitNewRequest(e: React.FormEvent) {
    e.preventDefault();
    setNewError("");
    if (!newAmount || !newVendor || !newReason) {
      setNewError("Amount, vendor, and reason are required.");
      return;
    }
    setNewSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(newAmount),
        vendor: newVendor,
        reason: newReason,
      };
      if (newCategory) body.category = newCategory;
      if (newNeededBy) body.neededBy = newNeededBy;

      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewAmount("");
        setNewVendor("");
        setNewCategory("");
        setNewReason("");
        setNewNeededBy("");
        setShowNewForm(false);
        fetchRequests();
      } else {
        const data = await res.json();
        setNewError(data.error ?? "Failed to submit request.");
      }
    } finally {
      setNewSubmitting(false);
    }
  }

  async function uploadReceipt(requestId: string, file: File) {
    setUploadingFor(requestId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/approvals/${requestId}/receipts`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error ?? "Upload failed");
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingFor(null);
    }
  }

  async function deleteReceipt(requestId: string, receiptId: string) {
    if (!confirm("Remove this receipt?")) return;
    try {
      const res = await fetch(`/api/approvals/${requestId}/receipts/${receiptId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchRequests();
    } catch {
      alert("Failed to delete receipt.");
    }
  }

  const pendingRequests = requests.filter(
    (r) => r.status === "PENDING" && r.requester.id !== userId
  );
  const myRequests = requests.filter((r) => r.requester.id === userId);

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Receipt section rendered inside each request card */
  function ReceiptSection({ req }: { req: PurchaseRequest }) {
    const canManage = role === "OWNER" || req.requester.id === userId;
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400">📎 Receipts:</span>

          {req.receipts.length === 0 && (
            <span className="text-xs text-gray-300">None attached</span>
          )}

          {req.receipts.map((r) => (
            <div key={r.id} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 rounded-md px-2 py-1 transition">
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-700 hover:underline max-w-[140px] truncate"
                title={r.fileName}
              >
                {r.fileName}
              </a>
              <span className="text-xs text-gray-400">({formatFileSize(r.fileSize)})</span>
              {canManage && (
                <button
                  onClick={() => deleteReceipt(req.id, r.id)}
                  className="ml-1 text-red-300 hover:text-red-500 transition text-xs font-bold"
                  title="Remove receipt"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Attach button */}
          {canManage && (
            <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2 py-1 rounded-md transition ${uploadingFor === req.id ? "text-gray-400" : "text-brand-600 hover:bg-brand-50"}`}>
              {uploadingFor === req.id ? "Uploading…" : "+ Attach"}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploadingFor === req.id}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadReceipt(req.id, file);
                  e.target.value = ""; // reset so same file can be re-uploaded
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Purchase Approvals &amp; Receipts
        </h1>
        <a href="/api/export/approvals" className="btn-secondary text-sm" download>
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["requests", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "requests" ? "Requests" : "My Requests"}
          </button>
        ))}
      </div>

      {/* REQUESTS TAB */}
      {tab === "requests" && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No pending requests.</div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800">{req.vendor}</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(req.amount)}</span>
                      {req.category && <span className="badge badge-blue">{req.category}</span>}
                      <span className={STATUS_BADGE[req.status]}>{req.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{req.reason}</p>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-3">
                      <span>Requested by <strong className="text-gray-600">{req.requester.name}</strong></span>
                      <span>Submitted {new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.neededBy && (
                        <span>Needed by {new Date(req.neededBy).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {(role === "OWNER" || role === "FAMILY") && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approve(req.id)}
                        disabled={actionSubmitting === req.id}
                        className="btn-primary text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setDenyId(req.id); setDenyReason(""); }}
                        className="btn-danger text-sm"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>

                {/* Receipt section */}
                <ReceiptSection req={req} />

                {/* Deny reason form inline */}
                {denyId === req.id && (
                  <form onSubmit={submitDeny} className="mt-4 border-t border-gray-100 pt-4 flex gap-2">
                    <input
                      type="text"
                      value={denyReason}
                      onChange={(e) => setDenyReason(e.target.value)}
                      placeholder="Reason for denial..."
                      className="input flex-1 text-sm"
                      required
                      autoFocus
                    />
                    <button type="submit" disabled={denySubmitting} className="btn-danger text-sm">
                      {denySubmitting ? "Denying..." : "Confirm Deny"}
                    </button>
                    <button type="button" onClick={() => setDenyId(null)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MY REQUESTS TAB */}
      {tab === "mine" && (
        <div className="space-y-4">
          {/* New request button */}
          <div className="flex justify-end">
            <button onClick={() => setShowNewForm((v) => !v)} className="btn-primary text-sm">
              {showNewForm ? "Cancel" : "+ New Request"}
            </button>
          </div>

          {/* New request form */}
          {showNewForm && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">New Purchase Request</h2>
              <form onSubmit={submitNewRequest} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($) *</label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vendor *</label>
                    <input
                      type="text"
                      value={newVendor}
                      onChange={(e) => setNewVendor(e.target.value)}
                      placeholder="Vendor name"
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Supplies, Repairs"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Needed By</label>
                    <input
                      type="date"
                      value={newNeededBy}
                      onChange={(e) => setNewNeededBy(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <textarea
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Describe the purchase and why it's needed..."
                    rows={2}
                    className="input w-full resize-none"
                    required
                  />
                </div>
                {newError && <p className="text-sm text-red-600">{newError}</p>}
                <div className="flex justify-end">
                  <button type="submit" disabled={newSubmitting} className="btn-primary text-sm">
                    {newSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My requests list */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : myRequests.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              You have no submitted requests.
            </div>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800">{req.vendor}</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(req.amount)}</span>
                      {req.category && <span className="badge badge-blue">{req.category}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{req.reason}</p>
                    {req.denialReason && (
                      <p className="text-sm text-red-600 mt-1">Denial reason: {req.denialReason}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Submitted {new Date(req.createdAt).toLocaleDateString()}
                      {req.neededBy && ` · Needed by ${new Date(req.neededBy).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={STATUS_BADGE[req.status]}>{req.status}</span>
                </div>

                {/* Receipt section */}
                <ReceiptSection req={req} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
