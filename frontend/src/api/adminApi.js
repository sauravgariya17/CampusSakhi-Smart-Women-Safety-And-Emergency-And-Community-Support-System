import api from "./axiosInstance";

export const DashboardApi = {
  getSummary: (windowDays = 30) =>
    api.get("/admin/dashboard/summary", { params: { windowDays } }).then((res) => res.data.data),
};

export const UserAdminApi = {
  listUsers: ({ role, keyword, page = 0, size = 20 } = {}) =>
    api.get("/admin/users", { params: { role, keyword, page, size } }).then((res) => res.data.data),

  updateRole: (userId, role) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then((res) => res.data.data),

  updateStatus: (userId, active) =>
    api.patch(`/admin/users/${userId}/status`, { active }).then((res) => res.data.data),
};

export const AuditLogApi = {
  search: ({ actionType, page = 0, size = 30 } = {}) =>
    api.get("/admin/audit-logs", { params: { actionType, page, size } }).then((res) => res.data.data),
};

export const ROLES = ["USER", "MODERATOR", "SECURITY_STAFF", "ADMIN"];

export const INCIDENT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
