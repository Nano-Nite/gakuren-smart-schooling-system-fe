import API_CONFIG from "../config/api";
import { authenticatedRequest } from "./api";
import { buildStudentUpdatePayload } from "./studentUpdatePayload";

export async function buildStudentActivationPayload(item, statusUuid) {
  const response = await authenticatedRequest(`${API_CONFIG.GET_STUDENTS}?uuid=${encodeURIComponent(item.id)}`, { method: "GET" });
  const detail = response.data;
  if (!detail?.uuid || detail.uuid !== item.id) throw new Error("Respons detail siswa tidak valid.");
  return { ...buildStudentUpdatePayload(detail, detail.uuid), status: statusUuid };
}
