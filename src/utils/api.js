import API_CONFIG, {
  getApiUrl,
  TOKEN_KEYS,
  ERROR_MESSAGES,
} from "../config/api";

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

export const loginRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const accessToken = sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);

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
  };

  if (encryptedPassword) {
    headers.Authorization = `Bearer ${encryptedPassword}`;
  }

  const config = {
    method: options.method,
    headers,
    ...options,
  };

  if (requestBody && typeof requestBody === "object") {
    config.body = JSON.stringify(requestBody);
  }

  try {
    const response = await fetch(url, config);
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
  const url = getApiUrl(endpoint);
  let requestBody = { ...options.body };

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN))

  if (sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)) {
    headers.Authorization = `Bearer ${sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)}`;
  }

  const config = {
    method: options.method,
    headers,
    ...options,
  };

  if (requestBody && typeof requestBody === "object") {
    config.body = JSON.stringify(requestBody);
  }

  try {
    const response = await fetch(url, config);
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

export const loginUser = async (email, password) => {
  const response = await loginRequest(API_CONFIG.LOGIN, {
    method: "POST",
    body: { email, password },
  });

  if (response.error) {
    throw new Error(response.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const { token, user_data, menu, permission } = response.data;
  const tenantId = response.data.tenant_id
    ?? response.data.tenant_uuid
    ?? user_data?.tenant_id
    ?? user_data?.tenant_uuid
    ?? user_data?.TenantID
    ?? user_data?.tenant?.id;
  sessionStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token.access_token);
  sessionStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token.refresh_token);
  sessionStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, token.expired_in);
  sessionStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user_data || {}));
  if (tenantId) sessionStorage.setItem(TOKEN_KEYS.TENANT_ID, tenantId);
  sessionStorage.setItem(TOKEN_KEYS.MENU_ITEMS, JSON.stringify(Array.isArray(menu) ? menu : []));
  sessionStorage.setItem(TOKEN_KEYS.PERMISSIONS, JSON.stringify(Array.isArray(permission) ? permission : []));
  sessionStorage.setItem(TOKEN_KEYS.IS_AUTHENTICATED, "true");

  return response;
};

export const logoutUser = async (email) => {
  const response = await logoutRequest(API_CONFIG.LOGOUT, {
    method: "POST",
    body: { email },
  });

  if (response.error) {
    throw new Error(response.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
  clearAuthData();
  return response;
};

export const clearAuthData = () => {
  sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRY);
  sessionStorage.removeItem(TOKEN_KEYS.USER_DATA);
  sessionStorage.removeItem(TOKEN_KEYS.TENANT_ID);
  sessionStorage.removeItem(TOKEN_KEYS.MENU_ITEMS);
  sessionStorage.removeItem(TOKEN_KEYS.PERMISSIONS);
  sessionStorage.removeItem(TOKEN_KEYS.IS_AUTHENTICATED);
};

export const isUserAuthenticated = () => {
  return sessionStorage.getItem(TOKEN_KEYS.IS_AUTHENTICATED) === "true";
};

export const getUserData = () => {
  const userData = sessionStorage.getItem(TOKEN_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

export const getAccessToken = () => {
  return sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

export const hasPermission = (permission) => {
  const permissions = sessionStorage.getItem(TOKEN_KEYS.PERMISSIONS);
  if (!permissions) return false;
  try {
    const storedPermissions = JSON.parse(permissions);
    const permissionsList = Array.isArray(storedPermissions)
      ? storedPermissions
      : Object.values(storedPermissions || {});
    return permissionsList.includes(permission);
  } catch {
    return false;
  }
};

export const authenticatedRequest = async (endpoint, options = {}) => {
  const accessToken = getAccessToken();
  const userData = getUserData();
  const tenantId = sessionStorage.getItem(TOKEN_KEYS.TENANT_ID)
    ?? userData?.tenant_id
    ?? userData?.tenant_uuid
    ?? userData?.TenantID
    ?? userData?.tenant?.id;

  if (!accessToken) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  if (!tenantId) throw new Error("Tenant ID tidak ditemukan. Silakan masuk kembali.");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      tenant_uuid: tenantId,
      ...options.headers,
    },
  };
  if (options.body && typeof options.body === "object") config.body = JSON.stringify(options.body);

  try {
    const response = await fetch(getApiUrl(endpoint), config);
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthData();
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
      setNetworkAvailable(false);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    throw error;
  }
};
