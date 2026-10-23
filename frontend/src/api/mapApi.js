import api from "./axiosInstance";

export const MapApi = {
  getMapConfig: () => api.get("/map/config").then((res) => res.data.data),
  getSafeZones: () => api.get("/map/safe-zones").then((res) => res.data.data),
};
