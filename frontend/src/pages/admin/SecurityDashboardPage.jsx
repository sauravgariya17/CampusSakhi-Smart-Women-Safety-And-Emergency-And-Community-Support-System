import React, { useEffect, useState } from "react";
import { ShieldAlert, Phone, MapPin, CheckCircle2, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { SosManagementApi } from "../../api/sosApi";
import { useToast } from "../../context/ToastContext";

const REFRESH_INTERVAL_MS = 8000;

export default function SecurityDashboardPage() {
  const toast = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [notes, setNotes] = useState("");

  const load = () => {
    SosManagementApi.getActiveQueue()
      .then(setQueue)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await SosManagementApi.acknowledge(id);
      toast.success("SOS alert acknowledged. Patrol dispatched.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to acknowledge SOS.");
    }
  };

  const handleResolve = async (id, outcome) => {
    try {
      await SosManagementApi.resolve(id, outcome, notes);
      toast.success(`SOS alert closed as ${outcome.replace("_", " ")}.`);
      setResolvingId(null);
      setNotes("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close SOS alert.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="cs-badge bg-rose-100 text-rose-700 mb-2">
            <ShieldAlert size={13} /> Live Security Dispatch Console
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Security Emergency Queue
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Auto-refreshes every 8 seconds. This is the internal GEHU campus security console (not connected to external police/112).
          </p>
        </div>
        <button onClick={load} className="cs-btn-secondary self-start">
          <RefreshCw size={15} /> Refresh Now
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      ) : queue.length === 0 ? (
        <div className="cs-card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Clear — Zero Active SOS Alerts</h3>
          <p className="text-xs text-slate-500 mt-1">
            Any student SOS that is confirmed or overdue safety journey that escalates will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((s) => (
            <div key={s.id} className="cs-card border-2 border-rose-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-base font-extrabold text-rose-700">
                    {s.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-mono text-slate-400">#{s.id}</span>
                </div>
                <span className={`cs-badge ${
                  s.status === "TRIGGERED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{s.requesterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Contact Phone</span>
                  <span className="font-semibold text-slate-800 inline-flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-violet-600" /> {s.requesterPhone || "No phone on file"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">GPS Coordinates</span>
                  <span className="font-mono font-semibold text-slate-800 inline-flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-rose-600" /> {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock size={12} /> Triggered: {new Date(s.triggeredAt || s.createdAt).toLocaleString()}
                </span>

                <div className="flex gap-2">
                  {s.status === "TRIGGERED" && (
                    <button
                      onClick={() => handleAcknowledge(s.id)}
                      className="cs-btn bg-amber-600 text-white hover:bg-amber-700 text-xs"
                    >
                      <CheckCircle2 size={15} /> Acknowledge & Dispatch Patrol
                    </button>
                  )}
                  {s.status === "ACKNOWLEDGED" && resolvingId !== s.id && (
                    <button
                      onClick={() => setResolvingId(s.id)}
                      className="cs-btn bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      Resolve / Close Alert
                    </button>
                  )}
                </div>
              </div>

              {resolvingId === s.id && (
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                  <label className="cs-label">Resolution Notes (Action Taken)</label>
                  <textarea
                    className="cs-input"
                    rows={2}
                    placeholder="Document patrol response, student status, or reason for false alarm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResolve(s.id, "RESOLVED")}
                      className="cs-btn bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                    <button
                      onClick={() => handleResolve(s.id, "FALSE_ALARM")}
                      className="cs-btn-secondary text-xs"
                    >
                      <AlertTriangle size={14} /> Mark False Alarm
                    </button>
                    <button
                      onClick={() => setResolvingId(null)}
                      className="cs-btn text-xs text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
