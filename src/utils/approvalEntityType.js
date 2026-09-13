export const isTeacherStaffEntity = entityType => {
  const type = String(entityType || "").trim().toLowerCase();
  return /teacher|staff|guru|staf/.test(type) || /(^|[^a-z0-9])tns([^a-z0-9]|$)/.test(type);
};

export const getApprovalEntityLabel = entityType => {
  const type = String(entityType || "").trim().toLowerCase();
  if (isTeacherStaffEntity(type)) {
    const teacher = /teacher|guru/.test(type);
    const staff = /staff|staf/.test(type);
    if (teacher && !staff) return "guru";
    if (staff && !teacher) return "staf";
    return "guru dan staf";
  }
  if (/class|kelas/.test(type)) return "kelas";
  if (/student|siswa/.test(type)) return "siswa";
  if (/location|lokasi|(^|[^a-z])loc([^a-z]|$)/.test(type)) return "lokasi scan";
  return "data";
};
