import React, { useEffect, useState } from "react";
import { BarChart3, ShieldAlert, TrendingUp, MapPin, Layers } from "lucide-react";
import { AnalyticsApi } from "../../api/incidentApi";

export default function SafetyAnalyticsPage() {
  const [data, setData] = useState(null);
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    AnalyticsApi.getSafetyAnalytics(windowDays)
      .then(setData)
      .finally(() => setLoading(false));
  }, [windowDays]);

  const maxCategoryCount = data ? Math.max(1, ...Object.values(data.reportsByCategory || {})) : 1;
  const maxAreaCount = data ? Math.max(1, ...Object.values(data.reportsByArea || {})) : 1;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="cs-badge bg-violet-100 text-violet-700 mb-2">
            <BarChart3 size={13} /> Privacy-Preserving Telemetry
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Safety Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated incident trends with automatic k-anonymity area suppression (k &ge; 3).
          </p>
        </div>

        <select
          className="cs-input py-2 text-xs font-semibold w-auto self-start"
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading || !data ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/80 text-amber-900 text-xs rounded-2xl p-4">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">k-Anonymity & Observational Data Notice</p>
              <p className="mt-0.5 text-amber-800">{data.disclaimer}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="cs-card p-6">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Layers size={16} className="text-violet-600" /> Reports by Category
              </h2>
              <div className="space-y-3">
                {Object.entries(data.reportsByCategory).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{cat.replace(/_/g, " ")}</span>
                      <span className="font-mono text-violet-700">{count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full transition-all"
                        style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(data.reportsByCategory).length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">No incident reports in this window.</p>
                )}
              </div>
            </div>

            <div className="cs-card p-6">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-rose-600" /> Reports by Campus Area
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Areas with fewer than 3 reports are automatically suppressed to protect reporter anonymity.
              </p>
              <div className="space-y-3">
                {Object.entries(data.reportsByArea).map(([area, count]) => (
                  <div key={area}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{area}</span>
                      <span className="font-mono text-rose-700">{count} reports</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${(count / maxAreaCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(data.reportsByArea).length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No single campus area has reached the minimum k-anonymity threshold (&ge; 3 reports) in this window.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="cs-card p-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-teal-600" /> Daily Report Volume ({windowDays} Days)
            </h2>
            <div className="flex items-end gap-1.5 h-32 pt-4">
              {data.trend.map((d) => {
                const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    title={`${d.date}: ${d.count} report(s)`}
                  >
                    <div
                      className="w-full bg-violet-500 hover:bg-violet-600 rounded-t transition-all"
                      style={{ height: `${(d.count / maxTrend) * 100}%`, minHeight: d.count > 0 ? "6px" : "2px", opacity: d.count > 0 ? 1 : 0.25 }}
                    />
                  </div>
                );
              })}
              {data.trend.length === 0 && (
                <p className="text-xs text-slate-400">No trend data available.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
