const nullableText = value => String(value ?? "").trim() || null;
const dateTime = value => value ? `${value}T00:00:00Z` : null;
const references = values => [...new Set(values || [])].map(uuid => ({ uuid }));

export const buildTeacherStaffPayload = form => ({
  biodata: {
    full_name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    gender_uuid: form.gender_uuid,
    birth_place: form.birth_place.trim(),
    birth_date: dateTime(form.birth_date),
    address: form.address.trim(),
  },
  education_level: form.educations.map(education => ({
    last_education: education.is_last_education,
    institution_name: education.institution.trim(),
    education_level_uuid: education.education_level_uuid,
    major: nullableText(education.major),
    start_year: Number(education.enrollment_year),
    end_year: Number(education.graduation_year),
  })),
  positions: references(form.position_uuids),
  titles: references([...form.title_prefix_uuids, ...form.title_suffix_uuids]),
  subjects: form.role === "staff" ? null : references(form.subject_uuids),
  is_staff: form.role === "staff",
  employee_status_uuid: nullableText(form.employment_status_uuid),
  img_location: null,
  nik: nullableText(form.nik),
  nuptk: form.role === "staff" ? null : nullableText(form.nuptk),
  nip: nullableText(form.nip),
  join_date: dateTime(form.join_date),
  resign_date: dateTime(form.resign_date),
});

export const getTeacherStaffCreateOutcome = response => {
  const data = response.data || {};
  const status = String(data.status ?? data.Status ?? "").toLowerCase();
  const pending = status === "pending" || Boolean(data.approval_uuid ?? data.approvalUUID ?? data.is_pending);
  return {
    pending,
    message: pending
      ? "Pengajuan guru/staf berhasil dikirim dan sedang menunggu persetujuan."
      : status === "active"
        ? "Data guru/staf berhasil dibuat."
        : "Data guru/staf berhasil dikirim. Status terbaru dimuat dari server.",
  };
};
