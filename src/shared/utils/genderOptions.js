import { getDailyReference } from "./dailyReferenceCache";

const normalizeOptions = payload => (payload.result || []).map(item => {
  const label = item.name ?? item.Name ?? item.label ?? item.Label ?? item.value ?? item.Value ?? item.code ?? item.Code;
  return { value: item.uuid ?? item.UUID ?? item.id ?? item.ID ?? item.code ?? item.Code ?? label, label, status: String(item.status ?? item.Status ?? "").toLowerCase() };
}).filter(item => item.value && item.label && (!item.status || item.status === "active"));

export const getGenderOptions = async (options = {}) => normalizeOptions(await getDailyReference("gender", options));
