import React, { useEffect, useState } from "react";
import { Flag, CheckCircle2, Trash2, Bot, User, ShieldCheck } from "lucide-react";
import { ModerationApi } from "../../api/moderationApi";
import { useToast } from "../../context/ToastContext";

export default function ModerationQueuePage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (targetPage = 0) => {
    setLoading(true);
    ModerationApi.getQueue({ page: targetPage, size: 20 })
      .then((data) => {
        setItems(data?.content || []);
        setPage(data?.page || 0);
        setTotalPages(data?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
  }, []);

  const handleDecision = async (queueId, decision) => {
    try {
      await ModerationApi.reviewItem(queueId, decision);
      toast.success(
        decision === "APPROVED"
          ? "Content approved and published to feed."
          : "Content removed from community."
      );
      load(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not record review decision.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Flag size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Community Moderation Queue</h1>
            <p className="text-xs text-slate-500">
              Review AI-flagged and user-reported posts or comments while preserving anonymous handles.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
          Loading moderation queue...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <ShieldCheck size={38} className="mx-auto text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-800">Moderation Queue Clear</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no pending AI-flagged or user-reported community items awaiting review.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => (
            <div
              key={item.queueId}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.targetType} #{item.targetId}
                  </span>
                  <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                    u/{item.contentAuthorHandle}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.flaggedBy === "AI"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.flaggedBy === "AI" ? <Bot size={12} /> : <User size={12} />}
                    Flagged by {item.flaggedBy}
                  </span>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-sm text-slate-800">
                {item.contentPreview}
              </div>

              {item.reason && (
                <p className="text-xs text-amber-800 bg-amber-50/70 border border-amber-200 rounded-lg px-3 py-1.5">
                  <strong>Flag Reason:</strong> {item.reason}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => handleDecision(item.queueId, "APPROVED")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <CheckCircle2 size={15} /> Approve & Publish
                </button>
                <button
                  onClick={() => handleDecision(item.queueId, "REMOVED")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Trash2 size={15} /> Remove Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-3">
          <button
            disabled={page === 0}
            onClick={() => load(page - 1)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-600 py-1.5">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => load(page + 1)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
