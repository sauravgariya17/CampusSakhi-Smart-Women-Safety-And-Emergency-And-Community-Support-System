import React, { useEffect, useState } from "react";
import { Siren, MapPin, XCircle } from "lucide-react";

export default function ConfirmationCountdown({
  expiresAt,
  category,
  coords,
  usedFallbackLocation,
  onConfirm,
  onCancel,
  onExpired,
}) {
  const computeSeconds = () => {
    if (!expiresAt) return 8;
    const diff = Math.round((new Date(expiresAt) - new Date()) / 1000);
    return diff > 0 ? diff : 8;
  };

  const [secondsLeft, setSecondsLeft] = useState(computeSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired?.();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, onExpired]);

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center border-2 border-rose-500">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-700 mb-3">
          Step 2 of 2 • Accidental Trigger Safeguard
        </span>

        <div className="w-24 h-24 rounded-full bg-rose-50 border-4 border-rose-600 mx-auto flex flex-col items-center justify-center mb-3 shadow-inner">
          <span className="text-3xl font-extrabold text-rose-600">{secondsLeft}s</span>
          <span className="text-[10px] font-semibold uppercase text-rose-500">Remaining</span>
        </div>

        <h3 className="text-lg font-extrabold text-slate-900">
          Confirm {category?.replace(/_/g, " ")} Alert
        </h3>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          No alert has been sent yet. Tap <strong>CONFIRM EMERGENCY</strong> below to immediately
          dispatch notifications to your Trusted Circle and GEHU Security.
        </p>

        {coords && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 mb-4 flex items-center justify-center gap-1.5">
            <MapPin size={14} className="text-rose-600 shrink-0" />
            <span>
              Coordinates: <strong>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</strong>{" "}
              {usedFallbackLocation ? "(GEHU Campus Center Fallback)" : "(Live Device GPS)"}
            </span>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-base shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 mb-2.5 transition-all"
        >
          <Siren size={19} /> CONFIRM EMERGENCY NOW
        </button>

        <button
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
        >
          <XCircle size={15} /> Cancel — Triggered by Mistake
        </button>
      </div>
    </div>
  );
}
