import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Flag, MapPin, ShieldCheck } from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import VoteButtons from "./VoteButtons";
import ReportModal from "./ReportModal";
import { CommunityApi } from "../../../api/communityApi";

export default function PostCard({ post, onVoteChange }) {
  const [showReport, setShowReport] = useState(false);
  const [voteState, setVoteState] = useState({
    upvoteCount: post.upvoteCount,
    downvoteCount: post.downvoteCount,
    myVote: post.myVote,
  });

  const handleVote = async (value) => {
    const result = await CommunityApi.votePost(post.id, value);
    setVoteState((prev) => {
      const wasVote = prev.myVote;
      let up = prev.upvoteCount;
      let down = prev.downvoteCount;
      if (wasVote === 1) up -= 1;
      if (wasVote === -1) down -= 1;
      if (result === 1) up += 1;
      if (result === -1) down += 1;
      return { upvoteCount: up, downvoteCount: down, myVote: result };
    });
    onVoteChange?.();
  };

  return (
    <div className="flex gap-4 bg-white border border-slate-200 hover:border-violet-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <VoteButtons
        upvoteCount={voteState.upvoteCount}
        downvoteCount={voteState.downvoteCount}
        myVote={voteState.myVote}
        onVote={handleVote}
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
            <ShieldCheck size={12} /> u/{post.anonymousHandle}
          </span>
          <span>&middot;</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {post.areaLabel && (
            <>
              <span>&middot;</span>
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <MapPin size={12} className="text-teal-600" /> {post.areaLabel}
              </span>
            </>
          )}
        </div>

        <Link to={`/community/posts/${post.id}`} className="block group">
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-violet-700 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        </Link>

        <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-slate-100">
          <CategoryBadge category={post.category} />
          <Link
            to={`/community/posts/${post.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700"
          >
            <MessageCircle size={14} /> {post.commentCount} comments
          </Link>
          <button
            onClick={() => setShowReport(true)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600"
          >
            <Flag size={13} /> Flag
          </button>
        </div>
      </div>

      {showReport && (
        <ReportModal
          targetType="POST"
          targetId={post.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
