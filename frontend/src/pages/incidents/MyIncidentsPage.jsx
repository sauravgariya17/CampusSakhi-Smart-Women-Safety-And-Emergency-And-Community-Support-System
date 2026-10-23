import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, MapPin, Sparkles, Clock } from "lucide-react";
import { IncidentApi } from "../../api/incidentApi";

const STATUS_STYLES = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-300",
  UNDER_REVIEW: "bg-amber-100 text-amber-800 border-amber-300",
  ASSIGNED: "bg-sky-100 text-sky-800 border-sky-300",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 border-indigo-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700",
};

export default function MyIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    IncidentApi.getMine()
      .then((data) => setIncidents(data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Incident Reports</h1>
            <p className="text-xs text-slate-500">
              Track the review status and priority of reports you have submitted.
            </p>
          </div>
        </div>

        <Link
          to="/incidents/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-sm shrink-0"
        >
          <Plus size={15} /> Report New Incident
        </Link>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
          Loading your incident reports...
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <ClipboardList size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No incident reports yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            When you submit a formal incident report, you can track its review progress here.
          </p>
          <Link
            to="/incidents/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
          >
            <Plus size={15} /> Submit a Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {incidents.map((i) => (
            <div
              key={i.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {i.category.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      PRIORITY_STYLES[i.priority] || "bg-slate-100"
                    }`}
                  >
                    {i.priority} Priority
                  </span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    STATUS_STYLES[i.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {i.status.replace(/_/g, " ")}
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{i.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {new Date(i.createdAt).toLocaleString()}
                </span>
                {i.areaLabel && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin size={12} className="text-violet-600" /> {i.areaLabel}
                  </span>
                )}
                <span className="text-slate-500">
                  Visibility: <strong>{i.visibilityType.replace(/_/g, " ")}</strong>
                </span>
                {i.aiSuggestedCategory && (
                  <span className="flex items-center gap-1 text-violet-600">
                    <Sparkles size={12} /> AI Triage: {i.aiSuggestedCategory.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
