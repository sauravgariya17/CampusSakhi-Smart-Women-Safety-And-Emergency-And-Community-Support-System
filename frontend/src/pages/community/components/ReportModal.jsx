import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import { CommunityApi } from "../../../api/communityApi";
import { useToast } from "../../../context/ToastContext";

export default function ReportModal({ targetType, targetId, onClose, onReported }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await CommunityApi.reportContent({ targetType, targetId, reason });
      toast.info("Content flagged for confidential moderator review.");
      onReported?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Flag size={16} className="text-rose-600" /> Report {targetType.toLowerCase()}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Your flag is confidential and enters the Moderator Queue. Neither the author nor other
          users can see who reported this content.
        </p>

        <textarea
          className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-3 text-sm mb-3 outline-none"
          rows={3}
          placeholder="Reason for flagging (e.g., spam, abusive phrasing, doxxing/identifying info)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <p className="text-xs text-rose-600 mb-3 font-medium">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Confidential Flag"}
          </button>
        </div>
      </div>
    </div>
  );
}
