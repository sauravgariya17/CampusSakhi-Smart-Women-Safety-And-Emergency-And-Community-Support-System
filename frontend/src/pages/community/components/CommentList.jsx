import React, { useEffect, useState } from "react";
import { Flag, Send, MessageSquare, Sparkles } from "lucide-react";
import { CommunityApi } from "../../../api/communityApi";
import { useToast } from "../../../context/ToastContext";
import VoteButtons from "./VoteButtons";
import ReportModal from "./ReportModal";

export default function CommentList({ postId, refreshKey }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await CommunityApi.getComments(postId);
      setComments(data.content || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, refreshKey]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim().length === 0) return;
    setSubmitting(true);
    try {
      await CommunityApi.addComment(postId, newComment.trim());
      setNewComment("");
      toast.success("Comment posted anonymously.");
      await loadComments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId, value) => {
    const result = await CommunityApi.voteComment(commentId, value);
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        let up = c.upvoteCount;
        let down = c.downvoteCount;
        if (c.myVote === 1) up -= 1;
        if (c.myVote === -1) down -= 1;
        if (result === 1) up += 1;
        if (result === -1) down += 1;
        return { ...c, upvoteCount: up, downvoteCount: down, myVote: result };
      })
    );
  };

  return (
    <div className="cs-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-600" />
          {comments.length} {comments.length === 1 ? "Community Reply" : "Community Replies"}
        </h4>
      </div>

      <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
        <input
          className="cs-input flex-1"
          placeholder="Add a supportive anonymous comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="cs-btn-primary"
        >
          <Send size={15} /> Reply
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <VoteButtons
                orientation="horizontal"
                upvoteCount={c.upvoteCount}
                downvoteCount={c.downvoteCount}
                myVote={c.myVote}
                onVote={(v) => handleVote(c.id, v)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-violet-700">
                    <Sparkles size={11} /> u/{c.anonymousHandle}
                  </span>
                  <span>&middot;</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  <button
                    onClick={() => setReportTarget(c.id)}
                    className="ml-auto inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Flag size={11} /> Report
                  </button>
                </div>
                <p className="text-sm text-slate-800 mt-1.5 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
              No replies yet. Be the first to share supportive advice.
            </p>
          )}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          targetType="COMMENT"
          targetId={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
