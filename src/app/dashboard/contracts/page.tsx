"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "VOID";

interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  body: string;
  createdAt: string;
}

interface ContractAction {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  notes: string | null;
}

interface Contract {
  id: string;
  title: string;
  status: ContractStatus;
  fileUrl: string | null;
  fileName: string | null;
  templateId: string | null;
  template: { id: string; name: string } | null;
  signatureData: string | null;
  signerName: string | null;
  signer: { id: string; name: string } | null;
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
  actions: ContractAction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ContractStatus, string> = {
  DRAFT: "badge badge-slate",
  SENT: "badge badge-blue",
  SIGNED: "badge badge-green",
  VOID: "badge badge-red",
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: "Draft",
  SENT: "Awaiting Signature",
  SIGNED: "Signed",
  VOID: "Void",
};

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onCapture }: { onCapture: (data: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#1d3557";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    drawing.current = false;
    if (hasDrawn.current && canvasRef.current) {
      onCapture(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onCapture(null);
  }

  return (
    <div>
      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={580}
          height={140}
          className="block w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-slate-400">Draw your signature above using your mouse or finger</p>
        <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-red-500 transition">
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Sign Modal ───────────────────────────────────────────────────────────────

function SignModal({
  contract,
  onClose,
  onSigned,
}: {
  contract: Contract;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [templateBody, setTemplateBody] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contract.templateId) {
      fetch(`/api/contracts/templates/${contract.templateId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((t) => t && setTemplateBody(t.body));
    }
  }, [contract.templateId]);

  async function submit() {
    if (!agreed || !signatureData) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });
      if (res.ok) {
        onSigned();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to sign");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sign Contract</h2>
            <p className="text-sm text-slate-500">{contract.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        {/* Contract content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {contract.fileUrl ? (
            <div className="mb-4">
              <a
                href={contract.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Contract Document ({contract.fileName ?? "File"})
              </a>
              <p className="text-xs text-slate-400 mt-1">Please review the document before signing.</p>
            </div>
          ) : templateBody ? (
            <div className="mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-56 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{templateBody}</pre>
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-slate-400 text-center py-4">Loading contract…</div>
          )}

          {/* Agreement checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600"
            />
            <span className="text-sm text-slate-700">
              I have read and agree to the terms of this contract. I understand that my drawn signature
              constitutes a legally binding electronic signature.
            </span>
          </label>

          {/* Signature canvas */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Your Signature</p>
            <SignatureCanvas onCapture={setSignatureData} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={!agreed || !signatureData || submitting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? "Signing…" : "Submit Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER";

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  // Mode: "contracts" | "templates"
  const [view, setView] = useState<"contracts" | "templates">("contracts");

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "template">("file");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplSubmitting, setTplSubmitting] = useState(false);
  const [tplError, setTplError] = useState("");

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) setContracts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/contracts/templates");
    if (res.ok) setTemplates(await res.json());
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchTemplates();
  }, [fetchContracts, fetchTemplates]);

  // ── Upload / create contract ────────────────────────────────────────────────

  async function submitContract(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    if (!uploadTitle.trim()) { setUploadError("Title is required."); return; }
    if (uploadMode === "file" && !uploadFile) { setUploadError("Please select a file."); return; }
    if (uploadMode === "template" && !selectedTemplateId) { setUploadError("Please select a template."); return; }

    setUploadSubmitting(true);
    try {
      let res: Response;
      if (uploadMode === "template") {
        res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: uploadTitle.trim(), templateId: selectedTemplateId }),
        });
      } else {
        const fd = new FormData();
        fd.append("title", uploadTitle.trim());
        fd.append("file", uploadFile!);
        res = await fetch("/api/contracts", { method: "POST", body: fd });
      }
      if (res.ok) {
        setUploadTitle(""); setUploadFile(null); setSelectedTemplateId(""); setShowUploadForm(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchContracts();
      } else {
        const data = await res.json();
        setUploadError(data.error ?? "Failed.");
      }
    } finally {
      setUploadSubmitting(false);
    }
  }

  // ── Send for signature ──────────────────────────────────────────────────────

  async function sendForSignature(contractId: string) {
    setSendingId(contractId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/send`, { method: "POST" });
      if (res.ok) fetchContracts();
    } finally {
      setSendingId(null);
    }
  }

  // ── Create template ─────────────────────────────────────────────────────────

  async function submitTemplate(e: React.FormEvent) {
    e.preventDefault();
    setTplError("");
    if (!tplName.trim()) { setTplError("Name is required."); return; }
    if (!tplBody.trim()) { setTplError("Contract body is required."); return; }
    setTplSubmitting(true);
    try {
      const res = await fetch("/api/contracts/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tplName.trim(), description: tplDesc.trim() || undefined, body: tplBody }),
      });
      if (res.ok) {
        setTplName(""); setTplDesc(""); setTplBody(""); setShowTemplateForm(false);
        fetchTemplates();
      } else {
        const data = await res.json();
        setTplError(data.error ?? "Failed.");
      }
    } finally {
      setTplSubmitting(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/contracts/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  // ── Pending signatures (for MANAGER) ───────────────────────────────────────
  const pendingSignatures = contracts.filter((c) => c.status === "SENT");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOwner
              ? "Create contracts from templates or upload files, then send for internal signature."
              : "Review and sign contracts assigned to you."}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button onClick={() => setShowTemplateForm((v) => !v)} className="btn-secondary text-sm">
              {showTemplateForm ? "Cancel" : "+ Template"}
            </button>
            <button onClick={() => setShowUploadForm((v) => !v)} className="btn-primary text-sm">
              {showUploadForm ? "Cancel" : "+ New Contract"}
            </button>
          </div>
        )}
      </div>

      {/* MANAGER: Pending signatures banner */}
      {isManager && pendingSignatures.length > 0 && (
        <div className="mb-5 bg-blue-50 border border-blue-300 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            📝 {pendingSignatures.length} contract{pendingSignatures.length > 1 ? "s" : ""} awaiting your signature
          </p>
          <div className="space-y-2">
            {pendingSignatures.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm text-blue-700">{c.title}</span>
                <button
                  onClick={() => setSigningContract(c)}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Review &amp; Sign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create template form */}
      {showTemplateForm && isOwner && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Create Contract Template</h2>
          <form onSubmit={submitTemplate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Template Name *</label>
                <input type="text" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. House Manager Agreement" className="input w-full" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input type="text" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Short description…" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contract Body *</label>
              <textarea
                value={tplBody}
                onChange={(e) => setTplBody(e.target.value)}
                rows={10}
                placeholder={"HOUSE MANAGER AGREEMENT\n\nThis agreement is entered into between...\n\n[OWNER NAME] (\"Owner\") and [MANAGER NAME] (\"Manager\")...\n\nTerms and Conditions:\n1. ...\n2. ..."}
                className="input w-full resize-y font-mono text-sm"
                required
              />
            </div>
            {tplError && <p className="text-sm text-red-600">{tplError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={tplSubmitting} className="btn-primary text-sm">
                {tplSubmitting ? "Saving…" : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New contract form */}
      {showUploadForm && isOwner && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">New Contract</h2>
          <form onSubmit={submitContract} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contract Title *</label>
              <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. House Manager Agreement 2026" className="input w-full" required />
            </div>

            {/* Mode toggle */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" checked={uploadMode === "file"} onChange={() => setUploadMode("file")} />
                Upload a file
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" checked={uploadMode === "template"} onChange={() => setUploadMode("template")} disabled={templates.length === 0} />
                Use a template {templates.length === 0 && <span className="text-slate-400 text-xs">(no templates yet)</span>}
              </label>
            </div>

            {uploadMode === "file" ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">File (PDF, DOC, DOCX) *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Template *</label>
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="input w-full" required>
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={uploadSubmitting} className="btn-primary text-sm">
                {uploadSubmitting ? "Creating…" : "Create Contract"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Contracts | Templates */}
      {isOwner && (
        <div className="flex gap-1 mb-4 border-b border-slate-200">
          {(["contracts", "templates"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
                view === v ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "contracts" ? `Contracts (${contracts.length})` : `Templates (${templates.length})`}
            </button>
          ))}
        </div>
      )}

      {/* ── Templates list ── */}
      {view === "templates" && isOwner && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              No templates yet. Click "+ Template" to create one.
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{t.name}</h3>
                    {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
                <details className="mt-3">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Preview content</summary>
                  <pre className="mt-2 text-xs text-slate-600 bg-slate-50 rounded p-3 overflow-auto max-h-40 whitespace-pre-wrap font-sans">
                    {t.body}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Contracts list ── */}
      {view === "contracts" && (
        loading ? (
          <p className="text-sm text-slate-500">Loading contracts…</p>
        ) : contracts.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            No contracts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{contract.title}</h3>
                      <span className={STATUS_BADGE[contract.status]}>
                        {STATUS_LABEL[contract.status]}
                      </span>
                      {contract.template && (
                        <span className="text-xs text-slate-400">from template: {contract.template.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(contract.createdAt).toLocaleDateString()}
                      {contract.sentAt && ` · Sent ${new Date(contract.sentAt).toLocaleDateString()}`}
                      {contract.signedAt && ` · Signed ${new Date(contract.signedAt).toLocaleDateString()}`}
                      {contract.signerName && ` by ${contract.signerName}`}
                    </p>

                    {/* Signature preview */}
                    {contract.status === "SIGNED" && contract.signatureData && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 mb-1">Signature on file:</p>
                        <img
                          src={contract.signatureData}
                          alt="Signature"
                          className="h-10 border border-slate-200 rounded bg-white px-2"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {contract.fileUrl && (
                      <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                        View File
                      </a>
                    )}
                    {isOwner && contract.status === "DRAFT" && (
                      <button
                        onClick={() => sendForSignature(contract.id)}
                        disabled={sendingId === contract.id}
                        className="btn-primary text-xs"
                      >
                        {sendingId === contract.id ? "Sending…" : "Send for Signature"}
                      </button>
                    )}
                    {isManager && contract.status === "SENT" && (
                      <button
                        onClick={() => setSigningContract(contract)}
                        className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition"
                      >
                        Sign
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId((prev) => prev === contract.id ? null : contract.id)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      {expandedId === contract.id ? "Hide History" : "History"}
                    </button>
                  </div>
                </div>

                {/* Audit trail */}
                {expandedId === contract.id && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Audit Trail</h4>
                    {contract.actions.length === 0 ? (
                      <p className="text-xs text-slate-400">No actions yet.</p>
                    ) : (
                      <ol className="relative border-l border-slate-200 ml-2 space-y-3">
                        {contract.actions.map((action) => (
                          <li key={action.id} className="pl-5 relative">
                            <div className="absolute w-2 h-2 bg-brand-600 rounded-full -left-1 top-1.5" />
                            <div className="text-xs text-slate-600">
                              <span className="font-medium text-slate-800">{action.action}</span>
                              {action.user && <span className="text-slate-400"> by {action.user.name}</span>}
                              <span className="text-slate-400 ml-2">{new Date(action.createdAt).toLocaleString()}</span>
                            </div>
                            {action.notes && <p className="text-xs text-slate-400 mt-0.5">{action.notes}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Sign modal */}
      {signingContract && (
        <SignModal
          contract={signingContract}
          onClose={() => setSigningContract(null)}
          onSigned={() => {
            setSigningContract(null);
            fetchContracts();
          }}
        />
      )}
    </div>
  );
}
