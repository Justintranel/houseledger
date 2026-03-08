"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import WorkersTable from "@/components/settings/WorkersTable";
import InviteWorkerForm from "@/components/settings/InviteWorkerForm";

interface Worker {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  hourlyRateCents: number;
  isActive: boolean;
  rateId: string | null;
}

interface Props {
  initialWorkers: Worker[];
}

export default function WorkersPageClient({ initialWorkers }: Props) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);

  const refreshWorkers = useCallback(async () => {
    const res = await fetch("/api/workers");
    if (res.ok) setWorkers(await res.json());
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/settings" className="text-sm text-slate-400 hover:text-slate-600">
              ← Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Workers & Rates</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage household members and set hourly pay rates
          </p>
        </div>
        <InviteWorkerForm onInvited={refreshWorkers} />
      </div>

      <WorkersTable initialWorkers={workers} />

      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
        <p>
          <strong>Note:</strong> Invited workers who don&apos;t have an account will be created
          automatically with a temporary password. Contact them to share their login credentials (
          <span className="font-mono">email</span> + temporary password from console logs in
          development, or implement email delivery for production).
        </p>
      </div>
    </div>
  );
}
