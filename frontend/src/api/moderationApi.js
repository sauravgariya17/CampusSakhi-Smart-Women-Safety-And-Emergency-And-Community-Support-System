import api from "./axiosInstance";

export const ModerationApi = {
  getQueue: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/moderation/queue", { params: { page, size } })
      .then((res) => res.data.data),

  reviewItem: (queueId, decision) =>
    api
      .post(`/moderation/queue/${queueId}/review`, { decision })
      .then((res) => res.data),
};
