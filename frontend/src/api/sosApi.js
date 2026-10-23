import api from "./axiosInstance";

export const SosApi = {
  trigger: ({ category, lat, lng }) =>
    api.post("/sos/trigger", { category, lat, lng }).then((res) => res.data.data),

  confirm: (sosId) =>
    api.post(`/sos/${sosId}/confirm`).then((res) => res.data.data),

  cancel: (sosId) =>
    api.post(`/sos/${sosId}/cancel`).then((res) => res.data.data),

  getActive: () =>
    api.get("/sos/active").then((res) => res.data.data).catch(() => null),

  getHistory: () =>
    api.get("/sos/history").then((res) => res.data.data),
};

export const SosManagementApi = {
  getActiveQueue: () =>
    api.get("/sos/manage/active").then((res) => res.data.data),

  acknowledge: (sosId) =>
    api.post(`/sos/manage/${sosId}/acknowledge`).then((res) => res.data.data),

  resolve: (sosId, outcome, notes) =>
    api.post(`/sos/manage/${sosId}/resolve`, { outcome, notes }).then((res) => res.data.data),
};

export const SOS_CATEGORIES = [
  { value: "PERSONAL_SAFETY", label: "Personal Safety" },
  { value: "MEDICAL_EMERGENCY", label: "Medical Emergency" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "OTHER", label: "Other" },
];
