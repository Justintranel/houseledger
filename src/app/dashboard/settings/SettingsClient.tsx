"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface HouseholdData {
  id: string;
  name: string;
  address: string | null;
  hourlyRate: number | null;
  workDays: string[];
  workStart: string | null;
  workEnd: string | null;
  subscriptionStatus: string | null;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string; email: string };
  }>;
  invites?: Array<{ id: string; email: string; role: string }>;
}

interface Props {
  initialHousehold: HouseholdData | null;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:   "bg-brand-100 text-brand-700",
  FAMILY:  "bg-green-100 text-green-700",
  MANAGER: "bg-amber-100 text-amber-700",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER:   "Owner",
  FAMILY:  "Family",
  MANAGER: "House Manager",
};

export default function SettingsClient({ initialHousehold }: Props) {
  const [tab, setTab] = useState<"household" | "team" | "security">("household");

  // ── Household tab ──────────────────────────────────────────────────────────
  const [householdName, setHouseholdName] = useState(initialHousehold?.name ?? "");
  const [address, setAddress] = useState(initialHousehold?.address ?? "");
  const [workDays, setWorkDays] = useState<string[]>(initialHousehold?.workDays ?? []);
  const [workStart, setWorkStart] = useState(initialHousehold?.workStart ?? "09:00");
  const [workEnd, setWorkEnd] = useState(initialHousehold?.workEnd ?? "17:00");
  const [householdSaving, setHouseholdSaving] = useState(false);
  const [householdSaved, setHouseholdSaved] = useState(false);
  const [householdError, setHouseholdError] = useState("");

  // ── Team tab ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState(initialHousehold?.members ?? []);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // ── Security tab ──────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  function toggleWorkDay(day: string) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function saveHousehold(e: React.FormEvent) {
    e.preventDefault();
    setHouseholdError("");
    setHouseholdSaving(true);
    try {
      const res = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName, address: address || undefined, workDays, workStart, workEnd }),
      });
      if (res.ok) {
        setHouseholdSaved(true);
        setTimeout(() => setHouseholdSaved(false), 3000);
      } else {
        const data = await res.json();
        setHouseholdError(data.error ?? "Failed to save.");
      }
    } finally {
      setHouseholdSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the household?")) return;
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/household/members/${memberId}`, { method: "DELETE" });
      if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } finally {
      setRemovingId(null);
    }
  }

  async function inviteFamilyMember(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Name and email are required.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: "FAMILY",
          workerType: "REGULAR",
          isTemporary: false,
          hourlyRateCents: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to invite member.");
        return;
      }
      setInviteSuccess(`✓ ${inviteName} has been added to the household.`);
      setInviteName("");
      setInviteEmail("");
      setInviteOpen(false);
      // Refresh member list
      const listRes = await fetch("/api/household");
      if (listRes.ok) {
        const updated = await listRes.json();
        if (updated?.members) setMembers(updated.members);
      }
    } finally {
      setInviting(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Failed to change password.");
        return;
      }
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 4000);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-slate-200">
        {(
          [
            ["household", "⚙️", "Household"],
            ["team", "👥", "Team Members"],
            ["security", "🔒", "Security"],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tab === key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* ── HOUSEHOLD TAB ─────────────────────────────────────────────────────── */}
      {tab === "household" && (
        <div className="max-w-2xl">
          <form onSubmit={saveHousehold} className="card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-4">Household Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Household Name *</label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    className="input w-full"
                    placeholder="The Smith Household"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Property Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input w-full"
                    placeholder="123 Main St, Beverly Hills, CA 90210"
                  />
                </div>
              </div>
            </div>

            {/* Work schedule */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Manager Work Schedule</h3>
              <p className="text-xs text-slate-400 mb-3">
                Used for timesheet validation and scheduling. Select which days your house manager typically works.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Work Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkDay(day)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        workDays.includes(day)
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Shift Start</label>
                  <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Shift End</label>
                  <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="input w-full" />
                </div>
              </div>
            </div>

            {householdError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{householdError}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={householdSaving} className="btn-primary text-sm">
                {householdSaving ? "Saving…" : "Save Changes"}
              </button>
              {householdSaved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
            </div>
          </form>
        </div>
      )}

      {/* ── TEAM TAB ──────────────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="max-w-2xl space-y-5">
          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              {inviteSuccess}
            </div>
          )}

          {/* Current members */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">Household Members</h2>
              <button
                onClick={() => { setInviteOpen((o) => !o); setInviteError(""); }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                + Invite Family Member
              </button>
            </div>

            {/* Invite form */}
            {inviteOpen && (
              <form onSubmit={inviteFamilyMember} className="px-5 py-4 bg-brand-50 border-b border-brand-100 space-y-3">
                <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Invite a Family Member</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="input text-sm"
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input text-sm"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Family members get <strong>view-only</strong> access to the household. They cannot log time or manage tasks.
                </p>
                {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={inviting} className="btn-primary text-sm py-1.5 px-4">
                    {inviting ? "Inviting…" : "Send Invite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInviteOpen(false); setInviteError(""); }}
                    className="btn-secondary text-sm py-1.5 px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Members list */}
            {members.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">No members yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{m.user.name}</p>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[m.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                      {m.role !== "OWNER" && (
                        <button
                          onClick={() => removeMember(m.id)}
                          disabled={removingId === m.id}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition"
                        >
                          {removingId === m.id ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending invites */}
          {initialHousehold?.invites && initialHousehold.invites.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">Pending Invites</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {initialHousehold.invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-slate-600">{inv.email}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[inv.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[inv.role] ?? inv.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            To add or manage your <strong>House Manager</strong>, go to{" "}
            <a href="/dashboard/settings/workers" className="text-brand-600 hover:underline font-medium">
              Workers & Rates →
            </a>
          </p>
        </div>
      )}

      {/* ── SECURITY TAB ──────────────────────────────────────────────────────── */}
      {tab === "security" && (
        <div className="max-w-md">
          <form onSubmit={changePassword} className="card p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-1">Change Password</h2>
              <p className="text-xs text-slate-400 mb-4">
                Use a strong password of at least 8 characters.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="input w-full"
                placeholder="Your current password"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input w-full"
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input w-full"
                placeholder="Repeat new password"
                required
              />
            </div>

            {pwError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✓ Password changed successfully!
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={pwSaving} className="btn-primary text-sm">
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs text-slate-400 space-y-1 px-1">
            <p>🔐 Passwords are encrypted and never stored in plain text.</p>
            <p>If you forget your password, use the{" "}
              <a href="/login" className="text-brand-600 hover:underline">Forgot Password</a> link on the login page.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
