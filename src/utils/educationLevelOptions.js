import { getDailyReference } from "./dailyReferenceCache";

const normalizeOptions = payload => (payload.result || []).map(item => ({
  value: item.uuid ?? item.UUID,
  code: item.code ?? item.Code ?? "",
  name: item.name ?? item.Name ?? "",
  label: item.code ?? item.Code ?? item.name ?? item.Name ?? "",
  levelOrder: Number(item.level_order ?? item.LevelOrder ?? 0),
  status: String(item.status ?? item.Status ?? "").toLowerCase(),
})).filter(item => item.value && item.label && (!item.status || item.status === "active"));

export const getEducationLevelOptions = async (options = {}) => normalizeOptions(await getDailyReference("education", options));
