import { authenticatedRequest } from "../utils/api";

const unwrap = response => response && Object.prototype.hasOwnProperty.call(response, "data") ? response.data : response;

export const attendanceService = {
  async getLocations(signal) {
    const response = await authenticatedRequest("/v1/attendance/locations", { signal });
    const data = unwrap(response);
    const locations = Array.isArray(data) ? data : data?.items ?? data?.locations ?? [];
    return locations.filter(item => {
      const status = String(item?.status ?? item?.Status ?? "").toLowerCase();
      return !status || status === "active";
    });
  },

  async getActiveSession(signal) {
    const response = await authenticatedRequest("/v1/attendance/sessions/active", { signal });
    return unwrap(response) || null;
  },

  async createSession(payload) {
    return unwrap(await authenticatedRequest("/v1/attendance/sessions", { method: "POST", body: payload }));
  },

  async closeSession(sessionUuid) {
    return unwrap(await authenticatedRequest(`/v1/attendance/sessions/${encodeURIComponent(sessionUuid)}/close`, { method: "POST" }));
  },

  async getSessionAttendances(sessionUuid, signal) {
    const response = await authenticatedRequest(`/v1/attendance/sessions/${encodeURIComponent(sessionUuid)}/attendances`, { signal });
    const data = unwrap(response);
    return {
      items: Array.isArray(data) ? data : data?.items ?? data?.attendances ?? [],
      summary: Array.isArray(data) ? null : data?.summary ?? null,
    };
  },

  async scanQr(payload) {
    return unwrap(await authenticatedRequest("/v1/attendance/scan", { method: "POST", body: payload }));
  },

  async getIdentityCredential(signal) {
    return unwrap(await authenticatedRequest("/v1/attendance/identity-credential", { signal }));
  },

  async getOfflineConfig(signal) {
    return unwrap(await authenticatedRequest("/v1/attendance/offline-config", { signal }));
  },

  async getTrustedDevice(signal) {
    return unwrap(await authenticatedRequest("/v1/attendance/trusted-device", { signal }));
  },

  async syncOfflineAttendances(deviceUuid, records) {
    return unwrap(await authenticatedRequest("/v1/attendance/offline-sync", { method: "POST", body: { device_uuid: deviceUuid, records } }));
  },
};
