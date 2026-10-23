import React, { useState } from "react";
import { EyeOff, Sparkles } from "lucide-react";
import { CommunityApi, POST_CATEGORIES } from "../../../api/communityApi";
import { useToast } from "../../../context/ToastContext";

export default function CreatePostForm({ onCreated, onCancel }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(POST_CATEGORIES[0].value);
  const [areaLabel, setAreaLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (title.trim().length < 5 || body.trim().length < 10) {
      setError("Please provide a title (5+ chars) and details (10+ chars).");
      return;
    }

    setSubmitting(true);
    try {
      const post = await CommunityApi.createPost({
        title: title.trim(),
        body: body.trim(),
        category,
        areaLabel: areaLabel.trim() || null,
      });
      toast.success("Post submitted to the anonymous community!");
      onCreated?.(post);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-violet-200 rounded-2xl p-5 space-y-4 shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <Sparkles size={16} className="text-violet-600" /> Share with the Community
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
          <EyeOff size={12} /> Posted under your anonymous handle only
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Topic / Tag</label>
          <select
            className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {POST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            General Campus Area (Optional)
          </label>
          <input
            className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
            placeholder="e.g. Gate 2 / Library Lane"
            value={areaLabel}
            onChange={(e) => setAreaLabel(e.target.value)}
            maxLength={120}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Post Title *</label>
        <input
          className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-2.5 text-sm outline-none"
          placeholder="Summarize your safety tip, question, or observation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Details *</label>
        <textarea
          className="w-full border border-slate-300 focus:border-violet-500 rounded-xl p-3 text-sm outline-none"
          rows={4}
          placeholder="Share helpful context for fellow students (avoid naming private individuals)..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
        />
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish Anonymously"}
        </button>
      </div>
    </form>
  );
}
