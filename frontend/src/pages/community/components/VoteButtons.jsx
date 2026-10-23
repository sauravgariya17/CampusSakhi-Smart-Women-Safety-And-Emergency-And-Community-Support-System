import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Controlled-ish component: shows current counts/vote, calls onVote(newValue)
 * and lets the parent decide how to refresh state after the API call.
 * Sending the SAME value the user already has toggles the vote off,
 * matching the backend's toggle semantics in VoteServiceImpl.
 */
export default function VoteButtons({ upvoteCount, downvoteCount, myVote, onVote, orientation = "vertical" }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async (value) => {
    if (busy) return;
    setBusy(true);
    try {
      await onVote(value);
    } finally {
      setBusy(false);
    }
  };

  const containerClass = orientation === "vertical"
    ? "flex flex-col items-center gap-1"
    : "flex flex-row items-center gap-2";

  return (
    <div className={containerClass}>
      <button
        aria-label="Upvote"
        disabled={busy}
        onClick={() => handleClick(1)}
        className={`p-1 rounded hover:bg-gray-100 ${myVote === 1 ? "text-green-600" : "text-gray-400"}`}
      >
        <ChevronUp size={20} />
      </button>
      <span className="text-sm font-semibold text-gray-700">
        {upvoteCount - downvoteCount}
      </span>
      <button
        aria-label="Downvote"
        disabled={busy}
        onClick={() => handleClick(-1)}
        className={`p-1 rounded hover:bg-gray-100 ${myVote === -1 ? "text-red-600" : "text-gray-400"}`}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
