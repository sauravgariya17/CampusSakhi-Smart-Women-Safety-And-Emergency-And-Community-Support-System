import React from "react";

const CATEGORY_STYLES = {
  HARASSMENT: "bg-red-100 text-red-700",
  STALKING: "bg-red-100 text-red-700",
  EVE_TEASING: "bg-orange-100 text-orange-700",
  UNSAFE_LIGHTING: "bg-yellow-100 text-yellow-700",
  SUSPICIOUS_ACTIVITY: "bg-orange-100 text-orange-700",
  SAFETY_TIP: "bg-green-100 text-green-700",
  QUESTION: "bg-blue-100 text-blue-700",
  SUPPORT: "bg-purple-100 text-purple-700",
};

const CATEGORY_LABELS = {
  HARASSMENT: "Harassment",
  STALKING: "Stalking",
  EVE_TEASING: "Eve Teasing",
  UNSAFE_LIGHTING: "Unsafe Lighting",
  SUSPICIOUS_ACTIVITY: "Suspicious Activity",
  SAFETY_TIP: "Safety Tip",
  QUESTION: "Question",
  SUPPORT: "Support",
};

export default function CategoryBadge({ category }) {
  if (!category) return null;
  const style = CATEGORY_STYLES[category] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${style}`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
