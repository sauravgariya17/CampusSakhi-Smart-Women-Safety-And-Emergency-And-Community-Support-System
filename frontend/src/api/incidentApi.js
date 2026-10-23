import api from "./axiosInstance";

export const IncidentApi = {
  // Preview only - does not save anything
  analyze: (description) =>
    api.post("/incidents/analyze", { description }).then((res) => res.data.data),

  create: ({ description, category, visibilityType, lat, lng, areaLabel }) =>
    api
      .post("/incidents", { description, category, visibilityType, lat, lng, areaLabel })
      .then((res) => res.data.data),

  getMine: () => api.get("/incidents/mine").then((res) => res.data.data),
};

export const IncidentAdminApi = {
  getAll: ({ category, priority, status, page = 0, size = 20 } = {}) =>
    api
      .get("/admin/incidents", { params: { category, priority, status, page, size } })
      .then((res) => res.data.data),

  review: (incidentId, { category, priority, status }) =>
    api
      .patch(`/admin/incidents/${incidentId}/review`, { category, priority, status })
      .then((res) => res.data.data),
};

export const AnalyticsApi = {
  getSafetyAnalytics: (windowDays = 30) =>
    api.get("/analytics/safety", { params: { windowDays } }).then((res) => res.data.data),
};

export const INCIDENT_CATEGORIES = [
  { value: "HARASSMENT", label: "Harassment" },
  { value: "STALKING", label: "Stalking" },
  { value: "UNSAFE_AREA", label: "Unsafe Area" },
  { value: "VERBAL_ABUSE", label: "Verbal Abuse" },
  { value: "PHYSICAL_THREAT", label: "Physical Threat" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "OTHER", label: "Other" },
];

export const VISIBILITY_OPTIONS = [
  { value: "ANON_PUBLIC", label: "Anonymous (may appear in aggregated public stats)" },
  { value: "NAMED_ADMIN_ONLY", label: "Share my identity with admins only" },
  { value: "FULL_ANON", label: "Fully anonymous, even to admins" },
];
