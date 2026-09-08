export function buildStudentUpdatePayload(form, uuid, includeParentContact = true) {
  const required = ["name", "nis", "nisn", "phone", "email", "class_uuid", "address", "gender_uuid"];
  const payload = { uuid };
  for (const key of required) {
    const value = form[key];
    if (value === undefined || value === null || !String(value).trim()) throw new Error("Detail siswa belum lengkap. Muat ulang data sebelum melanjutkan.");
    payload[key] = String(value).trim();
  }
  for (const key of ["parent_name", "parent_email", "parent_phone", "parent_address"]) {
    payload[key] = includeParentContact ? String(form[key] ?? "").trim() || null : null;
  }
  return payload;
}
