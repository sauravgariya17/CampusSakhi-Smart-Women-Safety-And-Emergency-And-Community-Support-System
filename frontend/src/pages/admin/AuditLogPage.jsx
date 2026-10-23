import React, { useEffect, useState } from "react";
import { FileClock, Search } from "lucide-react";
import { AuditLogApi } from "../../api/adminApi";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionType, setActionType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (targetPage = 0) => {
    setLoading(true);
    AuditLogApi.search({ actionType: actionType || undefined, page: targetPage, size: 25 })
      .then((data) => {
        setLogs(data.content || []);
        setPage(data.page);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="cs-badge bg-slate-200 text-slate-800 mb-2">
            <FileClock size={13} /> Compliance & Accountability
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tamper-evident record of sensitive actions across the platform (SOS handling, moderation, role changes, incident overrides).
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            className="cs-input pl-9 text-xs"
            placeholder="Filter by action (e.g. SOS_CONFIRMED)..."
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
          <div className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div key={log.id} className="cs-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                    {log.actionType}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Actor: {log.actorName}
                  </span>
                  {log.targetType && (
                    <span className="text-xs text-slate-500">
                      &rarr; {log.targetType}{log.targetId ? ` #${log.targetId}` : ""}
                    </span>
                  )}
                </div>
                {log.reason && (
                  <p className="text-xs text-slate-600 mt-1.5">{log.reason}</p>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="cs-card p-10 text-center text-sm text-slate-400">
              No audit entries match this filter.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            disabled={page === 0}
            onClick={() => load(page - 1)}
            className="cs-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => load(page + 1)}
            className="cs-btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
