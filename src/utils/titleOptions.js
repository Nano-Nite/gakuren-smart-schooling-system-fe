import { getDailyReference } from "./dailyReferenceCache";

const normalize = payload => (payload.result || []).map(item => ({
  value: item.uuid ?? item.UUID ?? item.id ?? item.ID,
  name: item.name ?? item.Name ?? "",
  label: item.abbr_name ?? item.AbbrName ?? item.abbreviation ?? item.name ?? item.Name,
  isPrefix: (item.is_prefix ?? item.IsPrefix) === true || String(item.is_prefix ?? item.IsPrefix).toLowerCase() === "true",
  sequence: Number(item.sequence ?? item.Sequence ?? 0),
  status: String(item.status ?? item.Status ?? "").toLowerCase(),
})).filter(item => item.value && item.label && (!item.status || item.status === "active")).sort((a, b) => a.name.localeCompare(b.name, "id"));

export const getTitleOptions = async (options = {}) => normalize(await getDailyReference("title", options));

export const formatIndonesianAcademicName = (name, prefixes = [], suffixes = []) => {
  const baseName = String(name || "").trim();
  const prefixPart = prefixes.filter(Boolean).join(" ");
  const suffixPart = suffixes.filter(Boolean).join(", ");
  return `${prefixPart ? `${prefixPart} ` : ""}${baseName}${suffixPart ? `, ${suffixPart}` : ""}`.trim();
};
