"use client";
import { useState } from "react";

interface Props {
  onInvited: () => void;
}

const WORKER_TYPE_OPTIONS = [
  { value: "REGULAR",      label: "House Manager",    temp: false },
  { value: "HOUSE_SITTER", label: "House Sitter",     temp: true  },
  { value: "BABY_SITTER",  label: "Baby Sitter",      temp: true  },
  { value: "DOG_SITTER",   label: "Dog Sitter",       temp: true  },
  { value: "OTHER_TEMP",   label: "Other Temporary",  temp: true  },
];

export default function InviteWorkerForm({ onInvited }: Props) {
  const [open, setOpen]               = useState(false);
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [role, setRole]               = useState<"MANAGER" | "FAMILY">("MANAGER");
  const [workerType, setWorkerType]   = useState("REGULAR");
  const [rateDollars, setRateDollars] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const selectedOption = WORKER_TYPE_OPTIONS.find((o) => o.value === workerType);
  const isTemp = selectedOption?.temp ?? false;

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          workerType,
          isTemporary: isTemp,
          hourlyRateCents: rateDollars ? Math.round(parseFloat(rateDollars) * 100) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add worker");
        return;
      }
      setName(""); setEmail(""); setRateDollars("");
      setRole("MANAGER"); setWorkerType("REGULAR");
      setOpen(false);
      onInvited();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm px-4 py-2">
        + Add Worker
      </button>
    );
  }

  return (
    <div className="card p-5 mb-5">
      <h3 className="font-semibold text-slate-800 mb-4">Add New Worker</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Full Name</label>
          <input className="input text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Email</label>
          <input type="email" className="input text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@email.com" />
        </div>

        {/* Worker type */}
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Worker Type</label>
          <select className="input text-sm" value={workerType} onChange={(e) => setWorkerType(e.target.value)}>
            <optgroup label="Permanent">
              <option value="REGULAR">House Manager</option>
            </optgroup>
            <optgroup label="Temporary">
              <option value="HOUSE_SITTER">House Sitter</option>
              <option value="BABY_SITTER">Baby Sitter</option>
              <option value="DOG_SITTER">Dog Sitter</option>
              <option value="OTHER_TEMP">Other Temporary</option>
            </optgroup>
          </select>
        </div>

        {/* Portal role */}
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Portal Role</label>
          <select className="input text-sm" value={role} onChange={(e) => setRole(e.target.value as "MANAGER" | "FAMILY")}>
            <option value="MANAGER">Manager (can log tasks & time)</option>
            <option value="FAMILY">Family (view only)</option>
          </select>
        </div>

        {/* Hourly rate */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-slate-500 block mb-1">
            Hourly Rate <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" min={0} step={0.01} className="input text-sm pl-7" value={rateDollars} onChange={(e) => setRateDollars(e.target.value)} placeholder="0.00" />
          </div>
        </div>
      </div>

      {isTemp && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <strong>Temporary worker</strong> — they&apos;ll have portal access matching their role and will be flagged as temporary in your worker list.
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm py-2 disabled:opacity-50">
          {submitting ? "Adding…" : "Add Worker"}
        </button>
        <button onClick={() => { setOpen(false); setError(""); }} className="btn-secondary text-sm py-2">Cancel</button>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        If this email doesn&apos;t have an account yet, one will be created and an invite email sent with their temporary credentials.
      </p>
    </div>
  );
}
