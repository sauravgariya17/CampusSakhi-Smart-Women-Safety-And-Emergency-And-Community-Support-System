import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Siren,
  MapPin,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { SosApi } from "../../api/sosApi";
import { useToast } from "../../context/ToastContext";
import CategoryModal from "./components/CategoryModal";
import ConfirmationCountdown from "./components/ConfirmationCountdown";

const STATE = {
  IDLE: "IDLE",
  PICKING_CATEGORY: "PICKING_CATEGORY",
  GETTING_LOCATION: "GETTING_LOCATION",
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
  CONFIRMING: "CONFIRMING",
  ACTIVE: "ACTIVE",
};

const CAMPUS_FALLBACK_COORDS = { lat: 30.2675, lng: 77.9959 };

export default function SosButton() {
  const toast = useToast();
  const [state, setState] = useState(STATE.IDLE);
  const [sos, setSos] = useState(null);
  const [usedFallbackLocation, setUsedFallbackLocation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    SosApi.getActive().then((active) => {
      if (active) {
        setSos(active);
        setState(
          active.status === "PENDING_CONFIRMATION"
            ? STATE.PENDING_CONFIRMATION
            : STATE.ACTIVE
        );
      }
    });
  }, []);

  useEffect(() => {
    if (state !== STATE.ACTIVE) return;
    const interval = setInterval(() => {
      SosApi.getActive().then((active) => {
        if (!active) {
          setState(STATE.IDLE);
          setSos(null);
        } else {
          setSos(active);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [state]);

  const initiateSosWithCoords = async (category, lat, lng, isFallback) => {
    try {
      setUsedFallbackLocation(isFallback);
      const created = await SosApi.trigger({ category, lat, lng });
      setSos(created);
      setState(STATE.PENDING_CONFIRMATION);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start SOS. Please try again.");
      setState(STATE.IDLE);
    }
  };

  const handleCategorySelected = (category) => {
    setError("");
    setState(STATE.GETTING_LOCATION);

    if (!("geolocation" in navigator)) {
      initiateSosWithCoords(
        category,
        CAMPUS_FALLBACK_COORDS.lat,
        CAMPUS_FALLBACK_COORDS.lng,
        true
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        initiateSosWithCoords(
          category,
          pos.coords.latitude,
          pos.coords.longitude,
          false
        );
      },
      () => {
        // Fallback to GEHU campus center if browser permission is denied or times out
        initiateSosWithCoords(
          category,
          CAMPUS_FALLBACK_COORDS.lat,
          CAMPUS_FALLBACK_COORDS.lng,
          true
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleConfirm = async () => {
    if (!sos) return;
    setState(STATE.CONFIRMING);
    try {
      const confirmed = await SosApi.confirm(sos.id);
      setSos(confirmed);
      setState(STATE.ACTIVE);
      toast.error("Emergency SOS confirmed! Campus Security & Trusted Circle notified.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not confirm SOS.");
      setState(STATE.IDLE);
      setSos(null);
    }
  };

  const handleCancelPending = async () => {
    try {
      if (sos) await SosApi.cancel(sos.id);
      toast.info("SOS cancelled before dispatch. No contacts were notified.");
    } finally {
      setState(STATE.IDLE);
      setSos(null);
    }
  };

  const handleExpired = () => {
    setState(STATE.IDLE);
    setSos(null);
    setError("Confirmation window expired. No emergency alert was sent.");
  };

  const handleImSafeNow = async () => {
    if (!sos) return;
    try {
      await SosApi.cancel(sos.id);
      toast.success("Alert closed — marked as safe.");
      setState(STATE.IDLE);
      setSos(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not close SOS alert.");
    }
  };

  return (
    <>
      {/* Floating SOS Trigger Button */}
      {state === STATE.IDLE && (
        <button
          onClick={() => {
            setError("");
            setState(STATE.PICKING_CATEGORY);
          }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold shadow-2xl shadow-rose-950/60 hover:from-rose-500 hover:to-red-500 ring-4 ring-rose-500/30 transition-all"
          aria-label="Trigger Emergency SOS"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <Siren size={20} />
          <span className="tracking-wide text-sm">SOS EMERGENCY</span>
        </button>
      )}

      {/* Preparing / Acquiring Location State */}
      {(state === STATE.GETTING_LOCATION || state === STATE.CONFIRMING) && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-rose-500/40 shadow-2xl rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-medium">
          <Loader2 size={18} className="animate-spin text-rose-400" />
          <span>
            {state === STATE.GETTING_LOCATION
              ? "Acquiring coordinates & preparing SOS..."
              : "Dispatching emergency alert to contacts & security..."}
          </span>
        </div>
      )}

      {/* Error Toast / Banner */}
      {error && state === STATE.IDLE && (
        <div className="fixed bottom-24 right-6 z-40 max-w-sm bg-amber-950/95 border border-amber-500/40 text-amber-100 text-xs rounded-xl p-3.5 shadow-xl flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-amber-300 hover:text-white"
            aria-label="Dismiss SOS error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Step 1: Pick Category */}
      {state === STATE.PICKING_CATEGORY && (
        <CategoryModal
          onSelect={handleCategorySelected}
          onClose={() => setState(STATE.IDLE)}
        />
      )}

      {/* Step 2: Confirm within 8-second Countdown */}
      {state === STATE.PENDING_CONFIRMATION && sos && (
        <ConfirmationCountdown
          expiresAt={sos.confirmationExpiresAt}
          category={sos.category}
          coords={{ lat: sos.lat, lng: sos.lng }}
          usedFallbackLocation={usedFallbackLocation}
          onConfirm={handleConfirm}
          onCancel={handleCancelPending}
          onExpired={handleExpired}
        />
      )}

      {/* Step 3: Active SOS Status Bar */}
      {state === STATE.ACTIVE && sos && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white px-4 py-4 shadow-2xl border-t-2 border-rose-300">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Siren size={22} className="animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm uppercase tracking-wider">
                    {sos.status === "ACKNOWLEDGED"
                      ? "Security Staff Acknowledged Your Alert"
                      : "Emergency SOS Active"}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/25 border border-white/20">
                    {sos.category?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-rose-100 mt-0.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} />{" "}
                    {sos.notes || "Trusted contacts & campus security notified"}
                  </span>
                  {sos.lat != null && sos.lng != null && (
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin size={12} /> {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)}
                      {usedFallbackLocation ? " (Campus Center Fallback)" : " (Live GPS)"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleImSafeNow}
              className="inline-flex items-center justify-center gap-1.5 bg-white text-rose-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-rose-50 shadow-md shrink-0 transition-colors"
            >
              <ShieldCheck size={17} /> I'm Safe Now (Resolve)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
