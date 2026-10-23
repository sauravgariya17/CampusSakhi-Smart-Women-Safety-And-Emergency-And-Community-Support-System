import React, { useEffect, useState } from "react";
import {
  Compass,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  History,
  RotateCcw,
} from "lucide-react";
import CampusMap from "../map/CampusMap";
import { useGeolocation } from "../map/useGeolocation";
import { JourneyApi } from "../../api/journeyApi";
import { ContactApi } from "../../api/contactApi";
import { useToast } from "../../context/ToastContext";
import ActiveJourneyView from "./ActiveJourneyView";

const CAMPUS_LANDMARKS = [
  { name: "GEHU Main Gate", lat: 30.2682, lng: 77.9964 },
  { name: "Central Library", lat: 30.2677, lng: 77.9958 },
  { name: "Girls Hostel Block A", lat: 30.2665, lng: 77.9948 },
  { name: "CS / IT Block", lat: 30.2679, lng: 77.9951 },
  { name: "Campus Medical Room", lat: 30.2671, lng: 77.9952 },
  { name: "Clement Town Subhash Nagar Gate", lat: 30.2659, lng: 77.9972 },
];

export default function JourneyModePage() {
  const toast = useToast();
  const { position, status, error } = useGeolocation();
  const [manualStart, setManualStart] = useState({ lat: 30.2682, lng: 77.9964 });
  const [destination, setDestination] = useState(null);
  const [duration, setDuration] = useState(15);
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [activeJourney, setActiveJourney] = useState(undefined);
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);
  const [formError, setFormError] = useState("");
  const [clickTarget, setClickTarget] = useState("destination"); // "start" | "destination"

  const effectiveStart = position || manualStart;

  const loadData = () => {
    JourneyApi.getActive().then(setActiveJourney);
    JourneyApi.getHistory()
      .then((h) => setHistory(h || []))
      .catch(() => setHistory([]));
    ContactApi.getAll()
      .then((c) => setContacts(c || []))
      .catch(() => setContacts([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleContact = (id) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    setFormError("");
    if (!effectiveStart) {
      setFormError("Please select a starting location on the map or pick a landmark.");
      return;
    }
    if (!destination) {
      setFormError("Please select your destination on the map or pick a campus landmark.");
      return;
    }

    setStarting(true);
    try {
      const journey = await JourneyApi.start({
        startLat: effectiveStart.lat,
        startLng: effectiveStart.lng,
        destLat: destination.lat,
        destLng: destination.lng,
        expectedDurationMinutes: duration,
        trustedContactIds: selectedContactIds,
      });
      toast.success("Safe Journey started! Live tracking link generated.");
      setActiveJourney(journey);
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Could not start journey. Please check campus bounds."
      );
    } finally {
      setStarting(false);
    }
  };

  if (activeJourney === undefined) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-sm text-slate-400">
        Loading Journey Mode...
      </div>
    );
  }

  if (activeJourney) {
    return (
      <ActiveJourneyView
        journey={activeJourney}
        onEnded={() => {
          setActiveJourney(null);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Compass size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Campus Safe Journey Mode</h1>
            <p className="text-xs text-slate-500">
              Share a live walkable route & arrival countdown within the 2.0 km GEHU Clement Town service area.
            </p>
          </div>
        </div>
      </div>

      {(status === "denied" || status === "unavailable") && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl p-3.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            {error} Defaulted start point to <strong>GEHU Main Gate</strong> — you can change both
            Start and Destination using the map or landmark buttons below.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
            <span className="font-semibold text-slate-700 px-2">Map Click Mode:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setClickTarget("start")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  clickTarget === "start"
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Set Start Point
              </button>
              <button
                type="button"
                onClick={() => setClickTarget("destination")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  clickTarget === "destination"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Set Destination
              </button>
            </div>
          </div>

          <CampusMap
            currentPosition={effectiveStart}
            selectedDestination={destination}
            selectable={true}
            onSelectDestination={(lat, lng) => {
              if (clickTarget === "start") {
                setManualStart({ lat, lng });
                setClickTarget("destination");
              } else {
                setDestination({ lat, lng });
              }
            }}
          />

          {/* Quick Campus Landmarks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-teal-600" /> Quick-Select GEHU Landmarks (Sets{" "}
              {clickTarget === "start" ? "Start Point" : "Destination"}):
            </p>
            <div className="flex flex-wrap gap-2">
              {CAMPUS_LANDMARKS.map((lm) => (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => {
                    if (clickTarget === "start") {
                      setManualStart({ lat: lm.lat, lng: lm.lng });
                      setClickTarget("destination");
                    } else {
                      setDestination({ lat: lm.lat, lng: lm.lng });
                    }
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-colors"
                >
                  {lm.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Journey Parameters</h2>

            <div className="space-y-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Start Point:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {effectiveStart
                    ? `${effectiveStart.lat.toFixed(4)}, ${effectiveStart.lng.toFixed(4)}`
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Destination:</span>
                <span className="font-mono font-semibold text-teal-700">
                  {destination
                    ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                    : "Click map or landmark"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-violet-600" /> Expected Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                {[10, 15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      duration === mins
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(180, Number(e.target.value))))}
                  className="w-20 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-violet-600" /> Share Live Journey With
              </label>
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No trusted contacts configured yet. You can still start a journey and copy the
                  public tracking link manually.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contacts.map((c) => {
                    const active = selectedContactIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleContact(c.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          active
                            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
                {formError}
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-900/20 disabled:opacity-50 transition-all"
          >
            {starting ? "Starting Safe Journey..." : "Start Live Tracked Journey"}
          </button>
        </div>
      </div>

      {/* Past Journeys History */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <History size={16} className="text-violet-600" /> Recent Safety Journeys
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.slice(0, 6).map((j) => (
              <div
                key={j.id}
                className="border border-slate-200/80 rounded-xl p-3.5 text-xs flex flex-col justify-between bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">Journey #{j.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      j.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : j.status === "ESCALATED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
                <p className="text-slate-500">
                  Started: {new Date(j.startTime).toLocaleString()}
                </p>
                {j.route && (
                  <p className="text-slate-600 font-medium mt-1">
                    Distance: {j.route.distanceMeters} m (~
                    {Math.max(1, Math.round(j.route.estimatedDurationSeconds / 60))} min walk)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
