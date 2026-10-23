import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  MessageSquareHeart,
  EyeOff,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { CommunityApi, POST_CATEGORIES } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import PostCard from "./components/PostCard";
import CreatePostForm from "./components/CreatePostForm";

export default function CommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("new");
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadFeed = async (targetPage = 0) => {
    setLoading(true);
    try {
      const data = await CommunityApi.getFeed({
        category: category || undefined,
        keyword: keyword || undefined,
        sort,
        page: targetPage,
        size: 10,
      });
      setPosts(data?.content || []);
      setPage(data?.page || 0);
      setTotalPages(data?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFeed(0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 mb-1">
            <EyeOff size={14} /> Zero-PII Anonymous Peer Network
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            CampusSakhi Safety Community
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Share safety alerts, lighting issues, and peer support anonymously as{" "}
            <strong className="font-mono text-violet-300">
              u/{user?.anonymousHandle || "Anonymous"}
            </strong>
            . Your real name is never visible here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((s) => !s)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-lg shadow-violet-950/50 shrink-0 transition-all"
        >
          <Plus size={16} /> {showCreateForm ? "Close Form" : "Share Post Anonymously"}
        </button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <CreatePostForm
          onCancel={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            loadFeed(0);
          }}
        />
      )}

      {/* Search + Sort Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2.5">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full border border-slate-200 focus:border-violet-500 rounded-xl pl-10 pr-3 py-2 text-sm outline-none"
              placeholder="Search campus safety posts, locations, or tips..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSort("new")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                sort === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Clock size={13} /> Newest
            </button>
            <button
              type="button"
              onClick={() => setSort("top")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                sort === "top" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Flame size={13} /> Top Voted
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            Search
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap transition-colors ${
              category === ""
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Categories
          </button>
          {POST_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap transition-colors ${
                category === c.value
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">
          Loading community posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <MessageSquareHeart size={38} className="mx-auto text-violet-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No community posts match this filter</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Be the first to share a campus safety tip, question, or observation anonymously.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
          >
            <Sparkles size={14} /> Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onVoteChange={() => {}} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 0}
            onClick={() => loadFeed(page - 1)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => loadFeed(page + 1)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
