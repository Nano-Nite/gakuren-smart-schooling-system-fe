import API_CONFIG from "../config/api";
import { authenticatedRequest } from "./api";
import { buildStudentUpdatePayload } from "./studentUpdatePayload";
import { getStudentDetail } from "./studentDetail";
import { resolveStudentClass } from "./resolveStudentClass";
import { resolveStudentGender } from "./resolveStudentGender";
import { getDailyReference } from "./dailyReferenceCache";

export async function buildStudentActivationPayload(item, statusUuid) {
  const response = await authenticatedRequest(`${API_CONFIG.GET_STUDENTS}?uuid=${encodeURIComponent(item.id)}`, { method: "GET" });
  const detail = getStudentDetail(response.data, item.id);
  const withClass = await resolveStudentClass(detail, body => authenticatedRequest(API_CONFIG.GET_CLASSES, { method: "POST", body }));
  const resolved = await resolveStudentGender(withClass, getDailyReference);
  return { ...buildStudentUpdatePayload(resolved, detail.uuid), status: statusUuid };
}
