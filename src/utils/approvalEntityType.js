export const isTeacherStaffEntity = entityType => {
  const type = String(entityType || "").trim().toLowerCase();
  return /teacher|staff|guru|staf/.test(type) || /(^|[^a-z0-9])tns([^a-z0-9]|$)/.test(type);
};
