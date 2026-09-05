import API_CONFIG, { TOKEN_KEYS } from "../config/api";
import { authenticatedRequest } from "./api";

const pending = new Map();
const definitions = {
  gender: { endpoint: API_CONFIG.GET_GENDERS, filter: { status: "active" }, rows: 20, sort: { status: "desc" } },
  title: { endpoint: API_CONFIG.GET_TITLES, filter: { status: "active" }, rows: 200, sort: { name: "asc" } },
  education: { endpoint: API_CONFIG.GET_EDUCATION_LEVELS, filter: { status: "active" }, rows: 200, sort: { level_order: "asc" } },
  position: { endpoint: API_CONFIG.GET_POSITIONS, rows: 20, sort: { name: "asc" } },
  employeeStatus: { endpoint: API_CONFIG.GET_EMPLOYEE_STATUSES, rows: 20, sort: { name: "desc" } },
};
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const abortError = () => new DOMException("Request aborted", "AbortError");
const forConsumer = (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => signal.aborted ? reject(abortError()) : resolve(value), reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
};

export const getDailyReference = (type, { isStaff, forceRefresh = false, missingOnly = false, signal } = {}) => {
  if (signal?.aborted) return Promise.reject(abortError());
  const tenant = sessionStorage.getItem(TOKEN_KEYS.TENANT_ID) || "default";
  const key = `gakuren:reference:v1:${tenant}:${type}:${isStaff === undefined ? "all" : isStaff ? "staff" : "teacher"}`;
  const day = today();
  let cached = null;
  try {
    const entry = JSON.parse(localStorage.getItem(key) || "null");
    if (entry && Array.isArray(entry.result) && entry.result.every(item => item && typeof item === "object") && typeof entry.syncedDay === "string") cached = entry;
  } catch { /* Missing or damaged storage is fetched again. */ }
  if (cached && (missingOnly || (!forceRefresh && cached.syncedDay === day))) return forConsumer(Promise.resolve({ result: cached.result }), signal);
  if (!pending.has(key)) {
    const definition = definitions[type];
    const request = (async () => {
      const result = [];
      let maxPage = 1;
      for (let page = 1; page <= maxPage; page += 1) {
        const response = await authenticatedRequest(definition.endpoint, { method: "POST", body: {
          search: null, filter: definition.filter || { is_staff: isStaff }, page,
          row_per_page: definition.rows, sort_by: [definition.sort],
        } });
        if (response.error || !Array.isArray(response.data?.result)) throw new Error("Respons data referensi tidak valid.");
        result.push(...response.data.result);
        maxPage = Number(response.data.data_statistic?.max_page || 1);
      }
      try { localStorage.setItem(key, JSON.stringify({ syncedDay: day, result })); } catch { /* Storage restrictions must not prevent using API results. */ }
      return { result };
    })().catch(error => {
      // Failed synchronization must not mark stale data as synchronized today.
      if (cached && !forceRefresh) return { result: cached.result };
      throw error;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return forConsumer(pending.get(key), signal);
};

export const syncDailyReferences = ({ signal, forceRefresh = false, missingOnly = false } = {}) => Promise.allSettled([
  ...["gender", "title", "education"].map(type => getDailyReference(type, { signal, forceRefresh, missingOnly })),
  ...[false, true].flatMap(isStaff => ["position", "employeeStatus"].map(type => getDailyReference(type, { isStaff, signal, forceRefresh, missingOnly }))),
]);
