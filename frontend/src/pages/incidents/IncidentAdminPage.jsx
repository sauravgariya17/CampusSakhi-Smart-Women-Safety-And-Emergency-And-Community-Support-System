import React, { useEffect, useState } from "react";
import { ShieldAlert, User, MapPin, Sparkles, EyeOff } from "lucide-react";
import { IncidentAdminApi, INCIDENT_CATEGORIES } from "../../api/incidentApi";
import { useToast } from "../../context/ToastContext";

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-rose-100 text-rose-800",
};

export default function IncidentAdminPage() {
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    IncidentAdminApi.getAll({ category: filterCategory || undefined, status: filterStatus || undefined })
      .then((data) => setIncidents(data.content || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus]);

  const updateStatus = async (id, status) => {
    try {
      await IncidentAdminApi.review(id, { status });
      toast.success(`Incident #${id} marked as ${status.replace(/_/g, " ")}.`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update incident status.");
    }
  };

  const overridePriority = async (id, priority) => {
    try {
      await IncidentAdminApi.review(id, { priority });
      toast.success(`Incident #${id} priority set to ${priority}.`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to override priority.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="cs-badge bg-violet-100 text-violet-700 mb-2">
            <ShieldAlert size={13} /> Incident Triage & Review
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Incident Review Queue
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-suggested category and priority are shown alongside each report. Human reviewers can override any value.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="cs-input py-2 text-xs font-semibold w-auto"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {INCIDENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            className="cs-input py-2 text-xs font-semibold w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((i) => (
            <div key={i.id} className="cs-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {i.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-mono text-slate-400">#{i.id}</span>
                  <span className="cs-badge bg-slate-100 text-slate-700">{i.status.replace(/_/g, " ")}</span>
                </div>
                <span className={`cs-badge ${PRIORITY_STYLES[i.priority]}`}>
                  Priority: {i.priority}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                {i.reporterName ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                    <User size={12} /> {i.reporterName} (Shared via NAMED_ADMIN_ONLY)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    <EyeOff size={12} /> Reporter identity protected ({i.visibilityType})
                  </span>
                )}
                {i.areaLabel && (
                  <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                    <MapPin size={12} className="text-violet-600" /> {i.areaLabel}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-800 leading-relaxed">{i.description}</p>

              {(i.aiSummary || i.aiSuggestedCategory) && (
                <div className="mt-3 rounded-xl bg-violet-50/70 border border-violet-100 p-3 text-xs text-violet-900 space-y-1">
                  {i.aiSummary && (
                    <p className="font-medium">
                      <Sparkles size={12} className="inline mr-1 text-violet-600" />
                      <strong>AI Summary:</strong> {i.aiSummary}
                    </p>
                  )}
                  <p className="text-violet-700">
                    AI Triage Suggestion: <strong>{i.aiSuggestedCategory?.replace(/_/g, " ")}</strong> /{" "}
                    <strong>{i.aiSuggestedPriority}</strong> ({Math.round((i.aiConfidence || 0) * 100)}% confidence)
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Override Priority:</span>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                    <button
                      key={p}
                      onClick={() => overridePriority(i.id, p)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                        i.priority === p
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Set Status:</span>
                  {["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(i.id, s)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        i.status === s
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="cs-card p-10 text-center text-sm text-slate-500">
              No incidents match the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
