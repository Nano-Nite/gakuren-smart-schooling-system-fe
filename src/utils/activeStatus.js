import { getDailyReference } from "./dailyReferenceCache";

export async function getActiveStatusUuid(fetchReference = getDailyReference) {
  const { result } = await fetchReference("status");
  const matches = result.filter(item => [item.code, item.name].some(value => String(value ?? "").trim().toLowerCase() === "active"));
  const uuids = [...new Set(matches.map(item => item.uuid).filter(value => typeof value === "string" && value.trim()))];
  if (uuids.length !== 1) throw new Error("UUID status aktif tidak ditemukan atau tidak unik. Muat ulang referensi status lalu coba lagi.");
  return uuids[0];
}
