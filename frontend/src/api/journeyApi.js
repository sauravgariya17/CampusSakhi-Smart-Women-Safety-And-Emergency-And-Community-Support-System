import api from "./axiosInstance";
// Public tracking uses the SAME axios instance but the endpoint itself is
// permitAll on the backend, so it works even without a token attached.

export const JourneyApi = {
  start: ({ startLat, startLng, destLat, destLng, expectedDurationMinutes, trustedContactIds }) =>
    api
      .post("/journeys", { startLat, startLng, destLat, destLng, expectedDurationMinutes, trustedContactIds })
      .then((res) => res.data.data),

  ping: (journeyId, lat, lng) =>
    api.post(`/journeys/${journeyId}/ping`, { lat, lng }).then((res) => res.data.data),

  checkIn: (journeyId) =>
    api.post(`/journeys/${journeyId}/checkin`).then((res) => res.data.data),

  cancel: (journeyId) =>
    api.post(`/journeys/${journeyId}/cancel`).then((res) => res.data.data),

  getActive: () =>
    api.get("/journeys/active").then((res) => res.data.data).catch(() => null),

  getHistory: () =>
    api.get("/journeys/history").then((res) => res.data.data),

  track: (token) =>
    api.get(`/journeys/track/${token}`).then((res) => res.data.data),
};
