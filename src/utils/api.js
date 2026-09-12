import { isMenuMap } from "./permissions";
export { hasPermission } from "./permissions";
import API_CONFIG, {
  getApiUrl,
  TOKEN_KEYS,
  ERROR_MESSAGES,
} from "../config/api";

import { cacheScopeFor, getCacheScope } from "./authScope";
import { clearOfflineSessionCache } from "../services/offlineAttendanceStore";

let accessToken = null;
let sessionVersion = 0;
let refreshPromise = null;
let initializePromise = null;
let loggingOut = false;
const LOGOUT_KEY = "gakuren:logout";
export const isServerLogoutPending = () => localStorage.getItem(LOGOUT_KEY)?.startsWith("pending:") === true;
const notifyAuth = () => window.dispatchEvent(new Event("gakuren:auth"));
export const getSessionVersion = () => sessionVersion;

// Migrate previous versions without ever reusing persisted bearer/refresh tokens.
for (const storage of [sessionStorage, localStorage]) {
  for (const key of [TOKEN_KEYS.ACCESS_TOKEN, TOKEN_KEYS.REFRESH_TOKEN, TOKEN_KEYS.TOKEN_EXPIRY, TOKEN_KEYS.IS_AUTHENTICATED]) storage.removeItem(key);
}

const authFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);
  try {
    return await fetch(getApiUrl(endpoint), {
      ...options,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        // BE must require this header AND validate Origin against its FE allowlist.
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } finally { clearTimeout(timer); }
};

const NETWORK_STATUS_KEY = "gakuren:network-status";
const persistedNetworkStatus = localStorage.getItem(NETWORK_STATUS_KEY);
let networkAvailable = navigator.onLine && persistedNetworkStatus !== "offline";

export const isNetworkAvailable = () => navigator.onLine && networkAvailable;
export const setNetworkAvailable = available => {
  const nextStatus = Boolean(available && navigator.onLine);
  networkAvailable = nextStatus;
  localStorage.setItem(NETWORK_STATUS_KEY, nextStatus ? "online" : "offline");
  window.dispatchEvent(new CustomEvent("gakuren:network", { detail: { online: nextStatus } }));
};

export const clearNetworkOfflineFlag = () => {
  networkAvailable = true;
  localStorage.removeItem(NETWORK_STATUS_KEY);
  window.dispatchEvent(new CustomEvent("gakuren:network", { detail: { online: true } }));
};

export const getScopeHeaders = () => {
  const userData = getUserData();
  const tenantId = sessionStorage.getItem(TOKEN_KEYS.TENANT_ID)
    ?? userData?.tenant_uuid
    ?? userData?.tenant_id
    ?? userData?.TenantID
    ?? userData?.tenant?.id;
  const schoolUuid = sessionStorage.getItem(TOKEN_KEYS.SCHOOL_UUID)
    ?? userData?.school_uuid;

  return {
    ...(tenantId ? { tenant_uuid: tenantId } : {}),
    ...(schoolUuid ? { school_uuid: schoolUuid } : {}),
  };
};

export const loginRequest = async (endpoint, options = {}) => {

  let encryptedPassword = null;
  let requestBody = { ...options.body };

  if (options.body?.password) {
    try {
      encryptedPassword = await encryptRSA(
        options.body.password,
        import.meta.env.VITE_RSA_PUBLIC_KEY,
      );
      const { password, ...bodyWithoutPassword } = requestBody;
      requestBody = bodyWithoutPassword;
    } catch (error) {
      console.error("RSA encryption failed:", error);
      throw new Error("Failed to encrypt credentials");
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...getScopeHeaders(),
  };

  if (encryptedPassword) {
    headers.Authorization = `Bearer ${encryptedPassword}`;
  }

  const config = {
    method: options.method,
    ...options,
    headers,
  };

  if (requestBody && typeof requestBody === "object") {
    config.body = JSON.stringify(requestBody);
  }

  try {
    const response = await authFetch(endpoint, config);
    const data = await response.json();

    if (response.status === 401) {
      clearAuthData();
      throw new Error(data.message || ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!response.ok) {
      throw new Error(data.message || ERROR_MESSAGES.SERVER_ERROR);
    }

    return data;
  } catch (error) {
    if (error.message === "Failed to fetch") {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    throw error;
  }
};

export const logoutRequest = async (endpoint, options = {}) => {
  const response = await authFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...getScopeHeaders(),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(options.body || {}),
  });
  const data = await response.json().catch(() => ({}));
  // Logout must revoke/expire the refresh cookie even when the access token expired.
  if (!response.ok || data.error) throw new Error(data.message || "Logout server gagal. Silakan coba lagi.");
  return data;
};

function decodeBase64(value) {
  const normalized = value
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return window.atob(padded);
}

function normalizePublicKey(publicKey) {
  if (!publicKey || typeof publicKey !== "string") {
    throw new Error("VITE_RSA_PUBLIC_KEY is not configured");
  }

  let key = publicKey.trim().replace(/^['\"]|['\"]$/g, "");

  // Support either a PEM value or a Base64-encoded PEM value in Vite env.
  if (!key.includes("-----BEGIN")) {
    key = decodeBase64(key);
  }

  key = key.replace(/\\n/g, "\n");

  if (!key.includes("-----BEGIN PUBLIC KEY-----")) {
    throw new Error("VITE_RSA_PUBLIC_KEY must contain an SPKI public key");
  }

  return key;
}

export async function encryptRSA(plainText, publicKey) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const base64String = normalizePublicKey(publicKey)
      .replace(/-----BEGIN [A-Z\s]+-----/g, "")
      .replace(/-----END [A-Z\s]+-----/g, "")
      .replace(/\s+/g, "");

    const binaryDerString = decodeBase64(base64String);
    const binaryDerBuffer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDerBuffer[i] = binaryDerString.charCodeAt(i);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      binaryDerBuffer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      data,
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (error) {
    console.error("RSA encryption error:", error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

const saveSession = (data, expectedScope = null) => {
  const { token, user_data, menu } = data || {};
  const tenantId = data?.tenant_uuid ?? data?.tenant_id ?? user_data?.tenant_uuid
    ?? user_data?.tenant_id ?? user_data?.TenantID ?? user_data?.tenant?.id;
  const schoolUuid = data?.school_uuid ?? user_data?.school_uuid;
  if (typeof token?.access_token !== "string" || !token.access_token || !tenantId || !schoolUuid
    || !cacheScopeFor(tenantId, schoolUuid, user_data) || !isMenuMap(menu)) {
    throw new Error("Respons sesi tidak lengkap. BE harus mengirim access token, pengguna, tenant, sekolah, menu dengan child dan permission.");
  }
  if (expectedScope && cacheScopeFor(tenantId, schoolUuid, user_data) !== expectedScope) {
    throw new Error("Akun atau sekolah berubah. Silakan masuk kembali.");
  }
  // Persist only display/context data. Tokens remain exclusively in memory/cookies.
  const displayFields = ["uuid", "user_uuid", "UserUUID", "id", "user_name", "name", "full_name", "role_name", "email", "phone", "tenant_name", "address"];
  const displayUser = Object.fromEntries(displayFields.filter(key => ["string", "number"].includes(typeof user_data[key])).map(key => [key, user_data[key]]));
  sessionStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(displayUser));
  sessionStorage.setItem(TOKEN_KEYS.TENANT_ID, tenantId);
  sessionStorage.setItem(TOKEN_KEYS.SCHOOL_UUID, schoolUuid);
  sessionStorage.setItem(TOKEN_KEYS.MENU_ITEMS, JSON.stringify(menu));
  sessionStorage.removeItem(TOKEN_KEYS.PERMISSIONS);
  accessToken = token.access_token;
};

export const clearAuthData = () => {
  const scope = getCacheScope();
  accessToken = null;
  sessionVersion += 1;
  for (const key of Object.values(TOKEN_KEYS)) sessionStorage.removeItem(key);
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("gakuren:reference:")) localStorage.removeItem(key);
  }
  localStorage.removeItem("gakuren:last-menu-route");
  notifyAuth();
  // Keep unsynced attendance in its owner partition to avoid losing recorded work.
  return clearOfflineSessionCache(scope).catch(error => {
    console.error("Pembersihan cache offline gagal:", error);
  });
};

export const loginUser = async (email, password) => {
  if (loggingOut) throw new Error("Logout sedang diproses.");
  await clearAuthData();
  const version = sessionVersion;
  // Wait for any previous refresh cookie rotation before starting a new login.
  await refreshPromise?.catch(() => {});
  const response = await loginRequest(API_CONFIG.LOGIN, {
    method: "POST", body: { email, password },
  });
  if (version !== sessionVersion) throw new Error("Sesi telah berubah. Silakan masuk kembali.");
  if (response.error) throw new Error(response.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
  saveSession(response.data);
  localStorage.removeItem(LOGOUT_KEY);
  notifyAuth();
  return response;
};

export const refreshSession = () => {
  if (loggingOut || localStorage.getItem(LOGOUT_KEY)) return Promise.reject(new Error("Silakan masuk kembali."));
  if (!refreshPromise) {
    const version = sessionVersion;
    const previousScope = getCacheScope();
    refreshPromise = (async () => {
      const response = await authFetch(API_CONFIG.REFRESH_TOKEN, {
        method: "POST", headers: getScopeHeaders(), body: "{}",
      });
      const data = await response.json().catch(() => ({}));
      if (version !== sessionVersion) throw new Error("Sesi telah berubah.");
      if (!response.ok || data.error) {
        if (response.status === 401 || response.status === 403 || (response.ok && data.error)) await clearAuthData();
        throw Object.assign(new Error(data.message || "Tidak dapat memulihkan sesi. Silakan coba lagi."), { status: response.status });
      }
      try {
        saveSession(data.data, previousScope);
        notifyAuth();
      } catch (error) {
        await clearAuthData();
        throw error;
      }
      return accessToken;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

export const initializeAuth = () => {
  if (!initializePromise) initializePromise = (async () => {
    if (localStorage.getItem(LOGOUT_KEY)) { await clearAuthData(); return; }
    try { await refreshSession(); }
    catch (error) {
      // Never grant access from a persisted flag, including during a cold offline launch.
      if (!accessToken) await clearAuthData();
      if (error.status !== 401 && error.status !== 403) throw error;
    }
  })().finally(() => { initializePromise = null; });
  return initializePromise;
};

export const logoutUser = async email => {
  loggingOut = true;
  sessionVersion += 1;
  // This marker prevents automatic re-login if cookie revocation fails/offline.
  localStorage.setItem(LOGOUT_KEY, `pending:${Date.now()}`);
  try {
    await refreshPromise?.catch(() => {});
    const response = await logoutRequest(API_CONFIG.LOGOUT, { method: "POST", body: { email } });
    localStorage.setItem(LOGOUT_KEY, `complete:${Date.now()}`);
    return response;
  } finally {
    await clearAuthData();
    loggingOut = false;
  }
};

window.addEventListener("storage", event => {
  if (event.key === LOGOUT_KEY && event.newValue) clearAuthData();
});

export const isUserAuthenticated = () => Boolean(accessToken) && !loggingOut;
export const getUserData = () => {
  try { return JSON.parse(sessionStorage.getItem(TOKEN_KEYS.USER_DATA) || "null"); }
  catch { return null; }
};
export const getAccessToken = () => accessToken;

export const authenticatedRequest = async (endpoint, options = {}, retried = false) => {
  const requestVersion = sessionVersion;
  const requestToken = getAccessToken();
  const scopeHeaders = getScopeHeaders();

  if (!requestToken || loggingOut) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  if (!scopeHeaders.tenant_uuid) throw new Error("Tenant ID tidak ditemukan. Silakan masuk kembali.");
  if (!scopeHeaders.school_uuid) throw new Error("School UUID tidak ditemukan. Silakan masuk kembali.");

  const config = {
    ...options,
    credentials: "omit",
    cache: "no-store",
    method: String(endpoint).split("?")[0].split("/").some(segment => segment.toLowerCase() === "update")
      ? "PATCH"
      : options.method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${requestToken}`,
      ...scopeHeaders,
    },
  };
  if (options.body && typeof options.body === "object") config.body = JSON.stringify(options.body);

  try {
    const response = await fetch(getApiUrl(endpoint), config);
    const data = await response.json().catch(() => ({}));
    if (requestVersion !== sessionVersion) throw new Error("Sesi telah berubah.");
    if (response.status === 401) {
      if (!retried) {
        if (requestToken === getAccessToken()) await refreshSession();
        if (requestVersion !== sessionVersion) throw new Error("Sesi telah berubah.");
        return authenticatedRequest(endpoint, options, true);
      }
      await clearAuthData();
      throw new Error(data.message || ERROR_MESSAGES.UNAUTHORIZED);
    }
    if (!response.ok || data.error) {
      const requestError = new Error(data.message || ERROR_MESSAGES.SERVER_ERROR);
      requestError.status = response.status;
      requestError.serverError = typeof data.error === "string" ? data.error : "";
      throw requestError;
    }
    setNetworkAvailable(true);
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error.message === "Failed to fetch") {
      // A feature endpoint can fail because it is missing or blocked by CORS
      // while the backend itself is healthy. Let the dedicated health check
      // decide whether the whole application is actually offline.
      window.dispatchEvent(new Event("gakuren:network-verify"));
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    throw error;
  }
};
