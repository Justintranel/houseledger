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

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
}

interface Props {
  initialHousehold: HouseholdData | null;
  initialFlags: FeatureFlag[];
}

export default function SettingsClient({
  initialHousehold,
  initialFlags,
}: Props) {
  const [tab, setTab] = useState<
    "household" | "members" | "flags"
  >("household");

  // Household form state
  const [householdName, setHouseholdName] = useState(
    initialHousehold?.name ?? ""
  );
  const [address, setAddress] = useState(
    initialHousehold?.address ?? ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialHousehold?.hourlyRate?.toString() ?? ""
  );
  const [workDays, setWorkDays] = useState<string[]>(
    initialHousehold?.workDays ?? []
  );
  const [workStart, setWorkStart] = useState(
    initialHousehold?.workStart ?? "09:00"
  );
  const [workEnd, setWorkEnd] = useState(
    initialHousehold?.workEnd ?? "17:00"
  );
  const [householdSaving, setHouseholdSaving] = useState(false);
  const [householdSaved, setHouseholdSaved] = useState(false);
  const [householdError, setHouseholdError] = useState("");

  // Members state
  const [members, setMembers] = useState(
    initialHousehold?.members ?? []
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Flags state
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [flagsSaving, setFlagsSaving] = useState<Record<string, boolean>>({});

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
        body: JSON.stringify({
          name: householdName,
          address: address || undefined,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          workDays,
          workStart,
          workEnd,
        }),
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
      const res = await fetch(`/api/household/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    setFlagsSaving((prev) => ({ ...prev, [flag.key]: true }));
    try {
      const res = await fetch("/api/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFlags(updated);
      }
    } finally {
      setFlagsSaving((prev) => ({ ...prev, [flag.key]: false }));
    }
  }

  const ROLE_BADGE: Record<string, string> = {
    OWNER: "badge-blue",
    FAMILY: "badge-green",
    MANAGER: "badge-yellow",
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {(
          [
            ["household", "Household"],
            ["members", "Members"],
            ["flags", "Feature Flags"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* HOUSEHOLD TAB */}
      {tab === "household" && (
        <div className="card max-w-2xl">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            Household Settings
          </h2>
          <form onSubmit={saveHousehold} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Household Name
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input w-full"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hourly Rate ($/hr)
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min="0"
                step="0.01"
                className="input w-48"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Work Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      workDays.includes(day)
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work Start Time
                </label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work End Time
                </label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
            {householdError && (
              <p className="text-sm text-red-600">{householdError}</p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={householdSaving}
                className="btn-primary text-sm"
              >
                {householdSaving ? "Saving..." : "Save Changes"}
              </button>
              {householdSaved && (
                <span className="text-sm text-green-600">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === "members" && (
        <div className="space-y-4 max-w-2xl">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Current Members
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">No members yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {m.user.name}
                      </p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${ROLE_BADGE[m.role] ?? "badge-slate"}`}
                      >
                        {m.role}
                      </span>
                      {m.role !== "OWNER" && (
                        <button
                          onClick={() => removeMember(m.id)}
                          disabled={removingId === m.id}
                          className="btn-danger text-xs"
                        >
                          {removingId === m.id ? "Removing..." : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {initialHousehold?.invites &&
            initialHousehold.invites.length > 0 && (
              <div className="card">
                <h2 className="text-base font-semibold text-gray-800 mb-4">
                  Pending Invites
                </h2>
                <div className="divide-y divide-gray-100">
                  {initialHousehold.invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-3"
                    >
                      <p className="text-sm text-gray-600">{inv.email}</p>
                      <span
                        className={`badge ${
                          ROLE_BADGE[inv.role] ?? "badge-slate"
                        }`}
                      >
                        {inv.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* FEATURE FLAGS TAB */}
      {tab === "flags" && (
        <div className="card max-w-2xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Feature Flags
          </h2>
          {flags.length === 0 ? (
            <p className="text-sm text-gray-400">No feature flags configured.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {flags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {flag.key}
                    </p>
                    {flag.description && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {flag.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={flagsSaving[flag.key]}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      flag.enabled ? "bg-brand-600" : "bg-gray-200"
                    } ${flagsSaving[flag.key] ? "opacity-50" : ""}`}
                    role="switch"
                    aria-checked={flag.enabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        flag.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
