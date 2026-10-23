import React from "react";
import { ShieldAlert, HeartPulse, Car, HelpCircle, X } from "lucide-react";
import { SOS_CATEGORIES } from "../../../api/sosApi";

const CATEGORY_META = {
  PERSONAL_SAFETY: {
    icon: ShieldAlert,
    desc: "Stalking, harassment, threat, or feeling unsafe",
    tone: "hover:border-rose-500 hover:bg-rose-50/70 text-rose-600",
  },
  MEDICAL_EMERGENCY: {
    icon: HeartPulse,
    desc: "Fainting, severe injury, or urgent health crisis",
    tone: "hover:border-amber-500 hover:bg-amber-50/70 text-amber-600",
  },
  ACCIDENT: {
    icon: Car,
    desc: "Road/campus collision or physical hazard",
    tone: "hover:border-orange-500 hover:bg-orange-50/70 text-orange-600",
  },
  OTHER: {
    icon: HelpCircle,
    desc: "Any other urgent campus safety situation",
    tone: "hover:border-violet-500 hover:bg-violet-50/70 text-violet-600",
  },
};

export default function CategoryModal({ onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-category-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 mb-1">
              Step 1 of 2 • Emergency Initiation
            </span>
            <h3 id="sos-category-title" className="text-lg font-extrabold text-slate-900">
              What type of emergency is happening?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecting a category prepares your location and opens an 8-second confirmation window.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SOS_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c.value] || CATEGORY_META.OTHER;
            const Icon = meta.icon;
            return (
              <button
                key={c.value}
                onClick={() => onSelect(c.value)}
                className={`p-3.5 text-left rounded-xl border border-slate-200 transition-all flex flex-col justify-between ${meta.tone}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select →
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{c.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{meta.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel — Do Not Start SOS
        </button>
      </div>
    </div>
  );
}
