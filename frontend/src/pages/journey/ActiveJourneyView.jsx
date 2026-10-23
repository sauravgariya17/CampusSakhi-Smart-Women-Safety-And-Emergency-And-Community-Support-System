import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  AlertTriangle,
  Copy,
  ExternalLink,
  Navigation,
  Clock,
  Send,
} from "lucide-react";
import CampusMap from "../map/CampusMap";
import { useGeolocation } from "../map/useGeolocation";
import { JourneyApi } from "../../api/journeyApi";
import { useToast } from "../../context/ToastContext";

const PING_INTERVAL_MS = 30_000;

export default function ActiveJourneyView({ journey, onEnded }) {
  const toast = useToast();
  const { position, status: geoStatus, error: geoError } = useGeolocation({ watch: true });
  const [current, setCurrent] = useState(journey);
  const [busy, setBusy] = useState(false);
  const [pingError, setPingError] = useState("");
  const [copied, setCopied] = useState(false);
  const lastPingRef = useRef(0);

  useEffect(() => {
    if (!position || current.status !== "ACTIVE") return;
    const now = Date.now();
    if (now - lastPingRef.current < PING_INTERVAL_MS) return;
    lastPingRef.current = now;

    JourneyApi.ping(current.id, position.lat, position.lng)
      .then((updated) => {
        setCurrent(updated);
        setPingError("");
      })
      .catch(() => {
        setPingError("Could not update your live location just now. Retrying automatically...");
      });
  }, [position, current.id, current.status]);

  const handleManualPing = async () => {
    const lat = position?.lat ?? current.lastKnownLat ?? current.startLat;
    const lng = position?.lng ?? current.lastKnownLng ?? current.startLng;
    try {
      const updated = await JourneyApi.ping(current.id, lat, lng);
      setCurrent(updated);
      toast.success("Live location heartbeat updated!");
    } catch {
      toast.error("Could not send location ping.");
    }
  };

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await JourneyApi.checkIn(current.id);
      toast.success("Checked in safely! Your tracking link has now expired.");
      onEnded();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await JourneyApi.cancel(current.id);
      toast.info("Journey cancelled.");
      onEnded();
    } finally {
      setBusy(false);
    }
  };

  const shareLink = `${window.location.origin}${current.shareUrl}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Live tracking link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Navigation size={22} className="text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Live Journey Active
              </span>
            </div>
            <h1 className="text-xl font-extrabold mt-0.5">Walking to Destination</h1>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={13} /> Expected Arrival:{" "}
                <strong>{new Date(current.expectedArrival).toLocaleTimeString()}</strong>
              </span>
              {current.route && (
                <span>
                  • Distance: <strong>{current.route.distanceMeters} m</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualPing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white shrink-0 transition-colors"
        >
          <Send size={14} /> Ping Location Now
        </button>
      </div>

      {geoStatus === "denied" && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{geoError} Using last known campus position.</span>
        </div>
      )}
      {pingError && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
          {pingError}
        </div>
      )}

      <CampusMap
        currentPosition={position || { lat: current.startLat, lng: current.startLng }}
        selectedDestination={{ lat: current.destLat, lng: current.destLng }}
        liveMarker={
          current.lastKnownLat != null
            ? { lat: current.lastKnownLat, lng: current.lastKnownLng }
            : null
        }
      />

      {/* Shareable Ephemeral Link Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <LinkIcon size={14} className="text-teal-600" /> Ephemeral Trusted Contact Tracking Link
          </span>
          <Link
            to={current.shareUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1"
          >
            Preview Public View <ExternalLink size={12} />
          </Link>
        </div>

        <div className="flex gap-2">
          <input
            readOnly
            value={shareLink}
            className="flex-1 text-xs font-mono border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700"
          />
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
          >
            <Copy size={14} /> {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Anyone with this link can see your live coordinates and destination ONLY while this
          journey is active. The link expires the instant you check in or cancel.
          {current.notifiedContactNames?.length > 0 && (
            <strong className="text-slate-700 block mt-1">
              Selected Contacts: {current.notifiedContactNames.join(", ")}
            </strong>
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={handleCheckIn}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all"
        >
          <CheckCircle size={18} /> I've Reached Safely (Complete Check-In)
        </button>
        <button
          onClick={handleCancel}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm disabled:opacity-50 transition-all"
        >
          <XCircle size={18} /> Cancel Journey
        </button>
      </div>
    </div>
  );
}
