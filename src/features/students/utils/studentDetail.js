const normalizeKey = key => key.replace(/_/g, "").toLowerCase();

export function getStudentDetail(payload, expectedUuid) {
  const candidates = [];
  const visit = value => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const fields = Object.fromEntries(Object.entries(value).map(([key, field]) => [normalizeKey(key), field]));
    if (fields.uuid) { candidates.push(fields); return; }
    for (const key of ["result", "instance", "data"]) visit(value[key]);
  };
  visit(payload);
  const matches = candidates.filter(item => String(item.uuid) === String(expectedUuid));
  if (matches.length !== 1) throw new Error("Detail siswa yang dipilih tidak ditemukan atau tidak unik dalam respons server. Muat ulang data siswa lalu coba lagi.");
  const detail = matches[0];
  const result = { uuid: detail.uuid };
  for (const key of ["name", "nis", "nisn", "phone", "email", "class_uuid", "class_name", "address", "gender_uuid", "gender_name", "parent_name", "parent_email", "parent_phone", "parent_address"]) {
    result[key] = detail[normalizeKey(key)];
  }
  result.phone ??= detail.phonenumber;
  return result;
}
