import api from "./axiosInstance";

export const AuthApi = {
  register: ({ name, email, password, phone }) =>
    api.post("/auth/register", { name, email, password, phone }).then((res) => res.data.data),

  login: ({ email, password }) =>
    api.post("/auth/login", { email, password }).then((res) => res.data.data),

  logout: (refreshToken) =>
    api.post("/auth/logout", { refreshToken }).then((res) => res.data.data),

  getMyProfile: () => api.get("/users/me").then((res) => res.data.data),
};
