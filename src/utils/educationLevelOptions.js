import API_CONFIG, { TOKEN_KEYS } from "../config/api";
import { authenticatedRequest } from "./api";

const tenantId = () => sessionStorage.getItem(TOKEN_KEYS.TENANT_ID) || "default";
const cacheKey = () => `gakuren:education-level-options:v2:${tenantId()}`;
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

const normalizeOptions = payload => (payload.result || []).map(item => ({
  value: item.uuid ?? item.UUID,
  code: item.code ?? item.Code ?? "",
  name: item.name ?? item.Name ?? "",
  label: item.code ?? item.Code ?? item.name ?? item.Name ?? "",
  levelOrder: Number(item.level_order ?? item.LevelOrder ?? 0),
  status: String(item.status ?? item.Status ?? "").toLowerCase(),
})).filter(item => item.value && item.label && (!item.status || item.status === "active"));

export const getEducationLevelOptions = async ({ forceRefresh = false, signal } = {}) => {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }
  if (!pendingRequest || forceRefresh) {
    pendingRequest = authenticatedRequest(API_CONFIG.GET_EDUCATION_LEVELS, {
      method: "POST",
      signal,
      body: { search: null, filter: { status: "active" }, page: 1, row_per_page: 200, sort_by: [{ level_order: "asc" }] },
    }).then(response => {
      const options = normalizeOptions(response.data || {});
      if (options.length) {
        memoryCache = { key: cacheKey(), options };
        try { localStorage.setItem(cacheKey(), JSON.stringify(options)); } catch { /* Memory cache remains available. */ }
      }
      return options;
    }).finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
};
