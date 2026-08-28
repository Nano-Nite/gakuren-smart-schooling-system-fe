import API_CONFIG, {
  getApiUrl,
  TOKEN_KEYS,
  ERROR_MESSAGES,
} from "../config/api";

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

const preserveKeyOrder = (obj) => {
  const map = new Map(Object.entries(obj));
  return JSON.stringify(Object.fromEntries(map));
};

export const loginUser = async (email, password) => {
  const response = await loginRequest(API_CONFIG.LOGIN, {
    method: "POST",
    body: { email, password },
  });

  if (response.error) {
    throw new Error(response.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const { token, user_data, menu, permission } = response.data;
  sessionStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token.access_token);
  sessionStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token.refresh_token);
  sessionStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, token.expired_in);
  sessionStorage.setItem(TOKEN_KEYS.USER_DATA, preserveKeyOrder(user_data));
  sessionStorage.setItem(TOKEN_KEYS.MENU_ITEMS, preserveKeyOrder(menu));
  sessionStorage.setItem(TOKEN_KEYS.PERMISSIONS, preserveKeyOrder(permission));
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
  const permissionsList = JSON.parse(permissions);
  return permissionsList.includes(permission);
};
