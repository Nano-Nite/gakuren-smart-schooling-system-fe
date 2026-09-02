import API_CONFIG, { TOKEN_KEYS } from "../config/api";
import { authenticatedRequest } from "./api";

const CACHE_VERSION = 1;
const tenantId = () => sessionStorage.getItem(TOKEN_KEYS.TENANT_ID) || "default";
const cacheKey = () => `gakuren:gender-options:v${CACHE_VERSION}:${tenantId()}`;
let memoryCache = null;
let pendingRequest = null;

const readCache = () => {
  if (memoryCache?.key === cacheKey()) return memoryCache.options;
  try {
    const options = JSON.parse(localStorage.getItem(cacheKey()) || "null");
    if (!Array.isArray(options) || !options.length) return null;
    memoryCache = { key: cacheKey(), options };
    return options;
  } catch {
    localStorage.removeItem(cacheKey());
    return null;
  }
};

const normalizeOptions = payload => (payload.result || []).map(item => {
  const label = item.name ?? item.Name ?? item.label ?? item.Label ?? item.value ?? item.Value ?? item.code ?? item.Code;
  return { value: item.uuid ?? item.UUID ?? item.id ?? item.ID ?? item.code ?? item.Code ?? label, label, status: String(item.status ?? item.Status ?? "").toLowerCase() };
}).filter(item => item.value && item.label && (!item.status || item.status === "active"));

export const getGenderOptions = async ({ forceRefresh = false, signal } = {}) => {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }
  if (!pendingRequest || forceRefresh) {
    pendingRequest = authenticatedRequest(API_CONFIG.GET_GENDERS, {
      method: "POST",
      signal,
      body: { search: null, filter: { status: "active" }, page: 1, row_per_page: 20, sort_by: [{ status: "desc" }] },
    }).then(response => {
      const options = normalizeOptions(response.data || {});
      if (options.length) {
        memoryCache = { key: cacheKey(), options };
        try { localStorage.setItem(cacheKey(), JSON.stringify(options)); } catch { /* Memory cache still avoids repeat calls for this session. */ }
      }
      return options;
    }).finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
};
