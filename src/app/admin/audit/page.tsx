"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  note: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string };
  before: any;
  after: any;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit?limit=200")
      .then((r) => r.json())
      .then((d) => { setLogs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Audit Log</h1>
        <p className="text-slate-500 text-sm mt-0.5">All admin actions on the platform</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading audit log…</p>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📜</p>
          <p className="font-medium text-slate-600">No admin actions recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-600">{log.entityType}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{log.entityId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{log.admin.name}</p>
                      <p className="text-xs text-slate-400">{log.admin.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{log.note ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      {(log.before || log.after) && (
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {expanded === log.id ? "Hide" : "Details"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === log.id && (log.before || log.after) && (
                    <tr key={log.id + "-detail"}>
                      <td colSpan={6} className="px-4 py-3 bg-slate-50">
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          {log.before && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">Before</p>
                              <pre className="bg-slate-100 rounded p-2 text-slate-700 overflow-auto max-h-32">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">After</p>
                              <pre className="bg-slate-100 rounded p-2 text-slate-700 overflow-auto max-h-32">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
