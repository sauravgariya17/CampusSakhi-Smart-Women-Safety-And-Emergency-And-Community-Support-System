import api from "./axiosInstance";

export const CommunityApi = {
  getFeed: ({ category, keyword, sort = "new", page = 0, size = 10 }) =>
    api
      .get("/community/posts", { params: { category, keyword, sort, page, size } })
      .then((res) => res.data.data),

  getPostDetail: (postId) =>
    api.get(`/community/posts/${postId}`).then((res) => res.data.data),

  createPost: ({ title, body, category, areaLabel }) =>
    api
      .post("/community/posts", { title, body, category, areaLabel })
      .then((res) => res.data.data),

  getComments: (postId, { page = 0, size = 20 } = {}) =>
    api
      .get(`/community/posts/${postId}/comments`, { params: { page, size } })
      .then((res) => res.data.data),

  addComment: (postId, body) =>
    api
      .post(`/community/posts/${postId}/comments`, { body })
      .then((res) => res.data.data),

  votePost: (postId, voteValue) =>
    api
      .post(`/community/posts/${postId}/vote`, { voteValue })
      .then((res) => res.data.data),

  voteComment: (commentId, voteValue) =>
    api
      .post(`/community/comments/${commentId}/vote`, { voteValue })
      .then((res) => res.data.data),

  reportContent: ({ targetType, targetId, reason }) =>
    api
      .post("/community/report", { targetType, targetId, reason })
      .then((res) => res.data.data),
};

// Kept in sync with entity.PostCategory on the backend.
export const POST_CATEGORIES = [
  { value: "HARASSMENT", label: "Harassment" },
  { value: "STALKING", label: "Stalking" },
  { value: "EVE_TEASING", label: "Eve Teasing" },
  { value: "UNSAFE_LIGHTING", label: "Unsafe Lighting" },
  { value: "SUSPICIOUS_ACTIVITY", label: "Suspicious Activity" },
  { value: "SAFETY_TIP", label: "Safety Tip" },
  { value: "QUESTION", label: "Question" },
  { value: "SUPPORT", label: "Support" },
];
