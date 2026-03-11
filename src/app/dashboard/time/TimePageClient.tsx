"use client";
import { useState } from "react";
import Link from "next/link";
import WeeklyTimesheet from "@/components/time/WeeklyTimesheet";
import PayoutSummary from "@/components/time/PayoutSummary";
import ClockNotificationSettings from "@/components/time/ClockNotificationSettings";

interface Props {
  role: string;
  userId: string;
}

type Tab = "timesheet" | "payouts" | "notifications";

export default function TimePageClient({ role, userId }: Props) {
  const [tab, setTab] = useState<Tab>("timesheet");

  const canSeePayout = role === "OWNER" || role === "FAMILY";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {role === "MANAGER" ? "Your hours and shift history" : "All worker hours and payouts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Clock In quick-link for manager */}
          {role === "MANAGER" && (
            <Link href="/dashboard/time/clock" className="btn-primary text-sm px-4 py-2">
              ⏱ Clock In / Out
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab("timesheet")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === "timesheet" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Timesheet
        </button>
        {canSeePayout && (
          <button
            onClick={() => setTab("payouts")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === "payouts" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Weekly Payouts
          </button>
        )}
        {role === "OWNER" && (
          <button
            onClick={() => setTab("notifications")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === "notifications" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            🔔 Notifications
          </button>
        )}
      </div>

      {tab === "timesheet" && <WeeklyTimesheet role={role} userId={userId} />}
      {tab === "payouts" && canSeePayout && <PayoutSummary role={role} />}
      {tab === "notifications" && role === "OWNER" && <ClockNotificationSettings />}
    </div>
  );
}
