const nullableText = value => String(value ?? "").trim() || null;
const dateTime = value => value ? `${value}T00:00:00Z` : null;
const references = values => [...new Set(values || [])].map(uuid => ({ uuid }));

export const buildTeacherStaffPayload = form => {
  if (form.resign_date && form.join_date && form.resign_date < form.join_date) throw new Error("Tanggal resign tidak boleh sebelum tanggal bergabung.");
  return ({
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
};

export const getTeacherStaffCreateOutcome = response => {
  const data = response.data || {};
  const status = String(data.status ?? data.Status ?? "").toLowerCase();
  const pending = status === "pending" || Boolean(data.approval_uuid ?? data.approvalUUID ?? data.is_pending);
  return {
    pending,
    message: pending
      ? "Pengajuan guru dan staf berhasil dikirim dan sedang menunggu persetujuan."
      : status === "active"
        ? "Data guru dan staf berhasil dibuat."
        : "Data guru dan staf berhasil dikirim. Status terbaru dimuat dari server.",
  };
};

export const buildTeacherStaffUpdatePayload = form => {
  const uuid = nullableText(form.uuid || form.id);
  const employeeUuid = nullableText(form.employee_uuid);
  if (!uuid || !employeeUuid) throw new Error("Detail guru dan staf belum memiliki UUID pengguna atau UUID pegawai. Muat ulang detail sebelum menyimpan.");
  const { biodata, employee_status_uuid, ...payload } = buildTeacherStaffPayload({ ...form, email: "", educations: form.educations || [], title_prefix_uuids: form.title_prefix_uuids || [], title_suffix_uuids: form.title_suffix_uuids || [] });
  const { email, ...updateBiodata } = biodata;
  const missing = Object.entries(updateBiodata).filter(([, value]) => !String(value ?? "").trim()).map(([key]) => key);
  if (missing.length) throw new Error(`Biodata belum lengkap: ${missing.join(", ")}.`);
  if (!employee_status_uuid || !payload.nik || !payload.join_date || !payload.positions.length) throw new Error("Lengkapi NIK, jabatan, tanggal bergabung, dan status kepegawaian.");
  if (!payload.education_level.length || payload.education_level.some(item => !item.institution_name || !item.education_level_uuid || !item.start_year || !item.end_year)) throw new Error("Lengkapi riwayat pendidikan sebelum menyimpan.");
  if (payload.education_level.filter(item => item.last_education).length !== 1) throw new Error("Pilih satu pendidikan terakhir sebelum menyimpan.");
  return { uuid, employee_uuid: employeeUuid, biodata: updateBiodata, ...payload, employee_status: employee_status_uuid, img_location: form.img_location ?? null };
};
