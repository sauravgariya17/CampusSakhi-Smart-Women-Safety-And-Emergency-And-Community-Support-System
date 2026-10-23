import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, MapPin, Clock, Lock } from "lucide-react";
import CampusMap from "../map/CampusMap";
import { JourneyApi } from "../../api/journeyApi";

const REFRESH_INTERVAL_MS = 15_000;

export default function TrackJourneyPage() {
  const { token } = useParams();
  const [journey, setJourney] = useState(undefined);
  const [error, setError] = useState("");

  const load = () => {
    JourneyApi.track(token)
      .then(setJourney)
      .catch(() => {
        setJourney(null);
        setError("This live tracking link has expired because the journey was completed or cancelled.");
      });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (journey === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-400">
        Loading live journey telemetry...
      </div>
    );
  }

  if (journey === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mb-1">Tracking Link Inactive</h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-5">{error}</p>
          <Link
            to="/welcome"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
          >
            Learn About CampusSakhi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-5">
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <ShieldCheck size={20} className="text-teal-300" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              CampusSakhi Ephemeral Live View
            </span>
            <h1 className="text-lg font-extrabold">Live Campus Journey Tracking</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold">
            {journey.status}
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Clock size={14} /> ETA: {new Date(journey.expectedArrival).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <CampusMap
        selectedDestination={{ lat: journey.destLat, lng: journey.destLng }}
        liveMarker={
          journey.lastKnownLat != null
            ? { lat: journey.lastKnownLat, lng: journey.lastKnownLng }
            : null
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} className="text-teal-600" />
          Last Known Position:{" "}
          {journey.lastKnownLat != null
            ? `${journey.lastKnownLat.toFixed(5)}, ${journey.lastKnownLng.toFixed(5)}`
            : "Awaiting ping"}
        </span>
        {journey.lastPingAt && (
          <span>Last heartbeat: {new Date(journey.lastPingAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
