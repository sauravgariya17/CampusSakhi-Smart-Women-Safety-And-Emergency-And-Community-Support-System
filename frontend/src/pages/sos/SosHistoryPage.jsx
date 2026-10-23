import React, { useEffect, useState } from "react";
import { Siren, MapPin, Clock, CheckCircle2, Info } from "lucide-react";
import { SosApi } from "../../api/sosApi";

const STATUS_STYLES = {
  PENDING_CONFIRMATION: "bg-slate-100 text-slate-700 border-slate-300",
  TRIGGERED: "bg-rose-100 text-rose-700 border-rose-300",
  ACKNOWLEDGED: "bg-amber-100 text-amber-800 border-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  FALSE_ALARM: "bg-sky-100 text-sky-700 border-sky-300",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function SosHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SosApi.getHistory()
      .then((data) => setHistory(data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Siren size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Emergency SOS Log</h1>
              <p className="text-xs text-slate-500">
                Complete audit history of your initiated, confirmed, and resolved SOS alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation vs Real Notification Transparency Notice */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs border border-slate-800">
        <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">
            Notification Delivery Transparency
          </span>
          Alerts only notify your Trusted Circle after you complete the 2-step confirmation. When
          SMTP email is disabled in local/test environments, notifications are recorded safely as
          simulated console dispatches and explicitly labeled in each event's notes below.
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
          Loading SOS history...
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No SOS alerts recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            You haven't triggered any emergency alerts yet. The red SOS button in the bottom-right
            corner is always available when you need it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {s.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{s.id}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    STATUS_STYLES[s.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {s.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  Created: {new Date(s.createdAt).toLocaleString()}
                </span>
                {s.lat != null && s.lng != null && (
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin size={13} className="text-rose-500" />
                    {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                  </span>
                )}
              </div>

              {s.notes && (
                <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Dispatch / Resolution Notes: </span>
                  {s.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
