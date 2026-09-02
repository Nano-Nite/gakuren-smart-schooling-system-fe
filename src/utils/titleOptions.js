import API_CONFIG, { TOKEN_KEYS } from "../config/api";
import { authenticatedRequest } from "./api";

const CACHE_VERSION = 2;
const tenantId = () => sessionStorage.getItem(TOKEN_KEYS.TENANT_ID) || "default";
const cacheKey = () => `gakuren:title-options:v${CACHE_VERSION}:${tenantId()}`;
let memoryCache = null;
let pendingRequest = null;

const readCache = () => {
  if (memoryCache?.key === cacheKey()) return memoryCache.options;
  try {
    const options = JSON.parse(localStorage.getItem(cacheKey()) || "null");
    if (!Array.isArray(options) || !options.length) return null;
    memoryCache = { key: cacheKey(), options };
    return options;
  } catch { localStorage.removeItem(cacheKey()); return null; }
};

const normalize = payload => (payload.result || []).map(item => ({
  value: item.uuid ?? item.UUID ?? item.id ?? item.ID,
  name: item.name ?? item.Name ?? "",
  label: item.abbr_name ?? item.AbbrName ?? item.abbreviation ?? item.name ?? item.Name,
  isPrefix: (item.is_prefix ?? item.IsPrefix) === true || String(item.is_prefix ?? item.IsPrefix).toLowerCase() === "true",
  sequence: Number(item.sequence ?? item.Sequence ?? 0),
  status: String(item.status ?? item.Status ?? "").toLowerCase(),
})).filter(item => item.value && item.label && (!item.status || item.status === "active")).sort((a, b) => a.name.localeCompare(b.name, "id"));

export const getTitleOptions = async ({ forceRefresh = false, signal } = {}) => {
  if (!forceRefresh) { const cached = readCache(); if (cached) return cached; }
  if (!pendingRequest || forceRefresh) {
    const requestPage = page => authenticatedRequest(API_CONFIG.GET_TITLES, { method: "POST", signal, body: { search: null, filter: { status: "active" }, page, row_per_page: 200, sort_by: [{ name: "asc" }] } });
    pendingRequest = requestPage(1)
      .then(async response => {
        const firstPage = response.data || {};
        const maxPage = Number(firstPage.data_statistic?.max_page || 1);
        const remainingPages = maxPage > 1 ? await Promise.all(Array.from({ length: maxPage - 1 }, (_, index) => requestPage(index + 2))): [];
        const combinedPayload = { result: [...(firstPage.result || []), ...remainingPages.flatMap(pageResponse => pageResponse.data?.result || [])] };
        const options = normalize(combinedPayload);
        if (options.length) { memoryCache = { key: cacheKey(), options }; try { localStorage.setItem(cacheKey(), JSON.stringify(options)); } catch { /* Keep memory cache. */ } }
        return options;
      }).finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
};

export const formatIndonesianAcademicName = (name, prefixes = [], suffixes = []) => {
  const baseName = String(name || "").trim();
  const prefixPart = prefixes.filter(Boolean).join(" ");
  const suffixPart = suffixes.filter(Boolean).join(", ");
  return `${prefixPart ? `${prefixPart} ` : ""}${baseName}${suffixPart ? `, ${suffixPart}` : ""}`.trim();
};
