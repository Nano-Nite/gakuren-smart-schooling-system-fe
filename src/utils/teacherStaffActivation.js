import API_CONFIG from "../config/api";
import { authenticatedRequest } from "./api";
import { getDailyReference } from "./dailyReferenceCache";
import { buildTeacherStaffEditForm, normalizeTeacherStaff } from "./teacherStaffData";
import { buildTeacherStaffUpdatePayload } from "./teacherStaffPayload";

export async function buildTeacherStaffActivationPayload(item, statusUuid) {
  const response = await authenticatedRequest(`${API_CONFIG.GET_TEACHER_STAFF}?uuid=${encodeURIComponent(item.id)}`, { method: "GET" });
  if (!response.data?.uuid) throw new Error("Respons detail guru dan staf tidak valid.");
  const detail = normalizeTeacherStaff({ ...response.data, occupation: response.data.occupation ?? item.occupation });
  const isStaff = detail.is_staff === true || /^(staff|staf)$/i.test(detail.occupation || "");
  const types = ["gender", "education", "position", "title", "employeeStatus", ...(!isStaff ? ["subject"] : [])];
  const entries = await Promise.all(types.map(async type => {
    const { result } = await getDailyReference(type, ["position", "employeeStatus"].includes(type) ? { isStaff } : {});
    return [type, result];
  }));
  const form = buildTeacherStaffEditForm(detail, Object.fromEntries(entries));
  return { ...buildTeacherStaffUpdatePayload(form), status_user: statusUuid };
}
