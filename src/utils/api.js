import API_CONFIG, {
  getApiUrl,
  TOKEN_KEYS,
  ERROR_MESSAGES,
} from "../config/api";

/**
 * Make API request with automatic token handling
 * @param {string} endpoint - API endpoint (e.g., '/v1/auth/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response data
 */
export const loginRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const accessToken = sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);

  // Encrypt password if present and send in header
  let encryptedPassword = null;
  let requestBody = { ...options.body };

  if (options.body?.password) {
    try {
      encryptedPassword = await encryptRSA(
        options.body.password,
        atob(import.meta.env.VITE_RSA_PUBLIC_KEY),
      );
      // Keep only email in body, remove password
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

  // Add authorization header if token exists
  if (encryptedPassword) {
    headers.Authorization = `Bearer ${encryptedPassword}`;
  }

  const config = {
    method: options.method,
    headers,
    ...options,
  };

  // Convert body to JSON if it's an object
  if (requestBody && typeof requestBody === "object") {
    config.body = JSON.stringify(requestBody);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Handle unauthorized (token expired)
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

    // Handle unauthorized (token expired)
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

// Encrypt plain text using a Public Key
export async function encryptRSA(plainText, publicKey) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    // 1. Remove PEM headers, footers, and whitespace
    const base64String = publicKey
      .replace(/-----BEGIN [A-Z\s]+-----/g, "")
      .replace(/-----END [A-Z\s]+-----/g, "")
      .replace(/\s+/g, "");

    // 2. Convert base64 string to binary ArrayBuffer
    const binaryDerString = window.atob(base64String);
    const binaryDerBuffer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDerBuffer[i] = binaryDerString.charCodeAt(i);
    }

    // 3. Import the public key for RSA-OAEP encryption
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      binaryDerBuffer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );

    // 4. Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      data,
    );

    // 5. Convert binary buffer to Base64 string for transmission
    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (error) {
    console.error("RSA encryption error:", error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

/**
 * Preserve object key order without sorting using Map
 * @param {Object} obj - Object to preserve order
 * @returns {string} JSON string with preserved key order
 */
const preserveKeyOrder = (obj) => {
  const map = new Map(Object.entries(obj));
  return JSON.stringify(Object.fromEntries(map));
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginUser = async (email, password) => {
  const response = await loginRequest(API_CONFIG.LOGIN, {
    method: "POST",
    body: { email, password },
  });

  if (response.error) {
    throw new Error(response.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Store authentication data
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

/**
 * Logout user
 */
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

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  sessionStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRY);
  sessionStorage.removeItem(TOKEN_KEYS.USER_DATA);
  sessionStorage.removeItem(TOKEN_KEYS.MENU_ITEMS);
  sessionStorage.removeItem(TOKEN_KEYS.PERMISSIONS);
  sessionStorage.removeItem(TOKEN_KEYS.IS_AUTHENTICATED);
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isUserAuthenticated = () => {
  return sessionStorage.getItem(TOKEN_KEYS.IS_AUTHENTICATED) === "true";
};

/**
 * Get user data from session
 * @returns {Object|null}
 */
export const getUserData = () => {
  const userData = sessionStorage.getItem(TOKEN_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Get access token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return sessionStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check (e.g., 'dashboard.view')
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const permissions = sessionStorage.getItem(TOKEN_KEYS.PERMISSIONS);
  if (!permissions) return false;
  const permissionsList = JSON.parse(permissions);
  return permissionsList.includes(permission);
};
