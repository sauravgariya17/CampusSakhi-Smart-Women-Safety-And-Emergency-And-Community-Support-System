import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Flag,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DashboardApi } from "../../api/adminApi";

function StatCard({ label, value, tone = "default", subtext }) {
  const toneStyles = {
    default: "text-slate-900 border-slate-200 bg-white",
    danger: "text-rose-600 border-rose-200 bg-rose-50/40",
    warning: "text-amber-600 border-amber-200 bg-amber-50/40",
    success: "text-emerald-600 border-emerald-200 bg-emerald-50/40",
  }[tone];

  return (
    <div className={`border rounded-2xl p-4 shadow-sm ${toneStyles}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      {subtext && <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  );
}

export default function AdminDashboardHome() {
  const [data, setData] = useState(null);
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    DashboardApi.getSummary(windowDays)
      .then(setData)
      .finally(() => setLoading(false));
  }, [windowDays]);

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center text-sm text-slate-400">
        Loading Campus Governance Dashboard...
      </div>
    );
  }

  const maxCategoryCount = Math.max(1, ...Object.values(data.incidentsByCategory || {}));
  const maxTrend = Math.max(1, ...(data.incidentTrend || []).map((t) => t.count));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Campus Safety Governance Overview
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated cross-module metrics for Incidents, Emergency SOS, and Community Moderation.
            </p>
          </div>
        </div>

        <select
          className="border border-slate-300 bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none"
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
        >
          <option value={7}>Window: Last 7 Days</option>
          <option value={30}>Window: Last 30 Days</option>
          <option value={90}>Window: Last 90 Days</option>
        </select>
      </div>

      {/* k-Anonymity Disclaimer */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl p-4">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <span>{data.disclaimer}</span>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Total Incidents" value={data.totalIncidents} />
        <StatCard label="Open Incidents" value={data.openIncidents} tone="warning" />
        <StatCard label="Resolved Incidents" value={data.resolvedIncidents} tone="success" />
        <StatCard label="Active Emergencies" value={data.activeEmergencyEvents} tone="danger" />
        <StatCard label="Total SOS Events" value={data.totalEmergencyEvents} />
        <StatCard label="Community Posts" value={data.totalCommunityPosts} />
        <StatCard label="Pending Post Review" value={data.pendingModerationPosts} tone="warning" />
        <StatCard label="Moderation Queue" value={data.moderationPending} tone="warning" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Incidents by Category */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-violet-600" /> Incidents by Category
            </h2>
            <Link
              to="/admin/incidents"
              className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
            >
              Triage Queue <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {Object.entries(data.incidentsByCategory || {}).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{cat.replace(/_/g, " ")}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(data.incidentsByCategory || {}).length === 0 && (
              <p className="text-xs text-slate-400 py-4">No incidents reported in this window.</p>
            )}
          </div>
        </div>

        {/* Moderation & Area Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Flag size={16} className="text-teal-600" /> Moderation Queue Breakdown
              </h2>
              <Link
                to="/admin/moderation"
                className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
              >
                Review Queue <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <span className="text-slate-500 block">Pending</span>
                <strong className="text-base text-amber-700">{data.moderationPending}</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <span className="text-slate-500 block">Approved</span>
                <strong className="text-base text-emerald-700">{data.moderationApproved}</strong>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                <span className="text-slate-500 block">Removed</span>
                <strong className="text-base text-rose-700">{data.moderationRemoved}</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Flag sources: {data.moderationAiFlagged} by AI Triage • {data.moderationUserFlagged} by
              Community Users
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-amber-600" /> Frequently Reported Areas (k ≥ 3)
            </h2>
            <ul className="text-xs text-slate-700 space-y-1.5">
              {Object.entries(data.incidentsByArea || {}).map(([area, count]) => (
                <li
                  key={area}
                  className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg"
                >
                  <span className="font-medium">{area}</span>
                  <span className="font-bold text-violet-700">{count} reports</span>
                </li>
              ))}
              {Object.keys(data.incidentsByArea || {}).length === 0 && (
                <li className="text-xs text-slate-400">
                  No campus areas currently exceed the 3-report k-anonymity privacy threshold.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-violet-600" /> Daily Incident Volume Trend
        </h2>
        <div className="flex items-end gap-1.5 h-28 pt-4">
          {(data.incidentTrend || []).map((d) => (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end h-full group"
              title={`${d.date}: ${d.count} report(s)`}
            >
              <div
                className="w-full bg-violet-500 group-hover:bg-violet-600 rounded-t-md transition-all"
                style={{
                  height: `${(d.count / maxTrend) * 100}%`,
                  minHeight: d.count > 0 ? "6px" : "0",
                }}
              />
              <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
          {(data.incidentTrend || []).length === 0 && (
            <p className="text-xs text-slate-400">No trend data in this window.</p>
          )}
        </div>
      </div>
    </div>
  );
}
