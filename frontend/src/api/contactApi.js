import api from "./axiosInstance";

export const ContactApi = {
  getAll: () => api.get("/contacts").then((res) => res.data.data),

  create: (payload) => api.post("/contacts", payload).then((res) => res.data.data),

  update: (contactId, payload) =>
    api.put(`/contacts/${contactId}`, payload).then((res) => res.data.data),

  remove: (contactId) => api.delete(`/contacts/${contactId}`).then((res) => res.data),
};
