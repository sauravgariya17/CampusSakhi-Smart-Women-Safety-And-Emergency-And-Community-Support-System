import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Flag, Sparkles, Clock } from "lucide-react";
import { CommunityApi } from "../../api/communityApi";
import CategoryBadge from "./components/CategoryBadge";
import VoteButtons from "./components/VoteButtons";
import CommentList from "./components/CommentList";
import ReportModal from "./components/ReportModal";

export default function PostDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await CommunityApi.getPostDetail(postId);
      setPost(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleVote = async (value) => {
    const result = await CommunityApi.votePost(postId, value);
    setPost((prev) => {
      let up = prev.upvoteCount;
      let down = prev.downvoteCount;
      if (prev.myVote === 1) up -= 1;
      if (prev.myVote === -1) down -= 1;
      if (result === 1) up += 1;
      if (result === -1) down += 1;
      return { ...prev, upvoteCount: up, downvoteCount: down, myVote: result };
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <div className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-sm font-semibold text-slate-500">Post not found or has been removed.</p>
        <Link to="/community" className="cs-btn-secondary mt-4 inline-flex">
          <ArrowLeft size={16} /> Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Anonymous Community
      </Link>

      <div className="cs-card p-6 flex gap-4">
        <VoteButtons
          upvoteCount={post.upvoteCount}
          downvoteCount={post.downvoteCount}
          myVote={post.myVote}
          onVote={handleVote}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
              <Sparkles size={11} /> u/{post.anonymousHandle}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock size={11} /> {new Date(post.createdAt).toLocaleString()}
            </span>
            {post.areaLabel && (
              <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                <MapPin size={11} className="text-slate-400" /> {post.areaLabel}
              </span>
            )}
            <button
              onClick={() => setShowReport(true)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Flag size={12} /> Report Post
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h1 className="text-xl font-extrabold text-slate-900">{post.title}</h1>
            <CategoryBadge category={post.category} />
          </div>

          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{post.body}</p>
        </div>
      </div>

      <CommentList postId={postId} />

      {showReport && (
        <ReportModal targetType="POST" targetId={post.id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
