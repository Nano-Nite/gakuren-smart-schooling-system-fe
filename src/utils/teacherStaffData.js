export const formatTeacherStaffStatus = value => ({ active: "Aktif", inactive: "Nonaktif", pending: "Pending", new_user: "Pengguna Baru", "new user": "Pengguna Baru", "new-user": "Pengguna Baru" })[String(value).toLowerCase()] || value || "-";

export const normalizeTeacherStaff = item => {
  const titles = [...(item.titles || [])].sort((a, b) => Number(a.sequence) - Number(b.sequence));
  return {
    ...item,
    id: item.uuid,
    position: item.positions?.map(position => typeof position === "string" ? position : position.name).join(", ") || item.occupation || "-",
    title_prefixes: titles.filter(title => title.is_prefix).map(title => title.abbr_name),
    title_suffixes: titles.filter(title => !title.is_prefix).map(title => title.abbr_name),
    status: formatTeacherStaffStatus(item.status_user ?? item.status),
  };
};

export const formatTeacherStaffDate = value => {
  if (!value) return "-";
  const date = new Date(String(value).slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(date);
};

// Detail responses contain display labels; edit controls require reference UUIDs.
export const buildTeacherStaffEditForm = (item, references = {}) => {
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const label = value => typeof value === "object" ? value?.name ?? value?.abbr_name ?? value?.code ?? "" : value;
  const resolve = (value, type) => {
    if (value?.uuid) return value.uuid;
    if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)) return value;
    const matches = (references[type] || []).filter(option => [option.name, option.code, option.abbr_name].some(text => text && String(text).trim().toLowerCase() === String(label(value)).trim().toLowerCase()));
    return matches.length === 1 ? matches[0].uuid : "";
  };
  const ids = (values, type) => list(values).map(value => resolve(value, type)).filter(Boolean);
  const role = item.role || (item.is_staff === true || /^(staff|staf)$/i.test(item.occupation || "") ? "staff" : "teacher");
  return {
    ...item,
    name: item.name ?? item.full_name ?? item.biodata?.full_name ?? "",
    phone: item.phone ?? item.biodata?.phone ?? "",
    birth_place: item.birth_place ?? item.biodata?.birth_place ?? "",
    address: item.address ?? item.biodata?.address ?? "",
    role,
    gender_uuid: item.gender_uuid || item.biodata?.gender_uuid || resolve(item.gender, "gender"),
    employment_status: item.employment_status ?? label(item.employee_status) ?? "",
    employment_status_uuid: item.employment_status_uuid || item.employee_status_uuid || resolve(item.employee_status, "employeeStatus"),
    position_uuids: item.position_uuids?.length ? item.position_uuids : ids(item.positions, "position"),
    subject_uuids: item.subject_uuids?.length ? item.subject_uuids : ids(item.subjects ?? item.subject, "subject"),
    title_prefix_uuids: item.title_prefix_uuids?.length ? item.title_prefix_uuids : ids(list(item.titles).filter(title => title.is_prefix), "title"),
    title_suffix_uuids: item.title_suffix_uuids?.length ? item.title_suffix_uuids : ids(list(item.titles).filter(title => !title.is_prefix), "title"),
    birth_date: (item.birth_date ?? item.biodata?.birth_date)?.slice(0, 10) || "",
    join_date: item.join_date?.slice(0, 10) || "",
    resign_date: item.resign_date?.slice(0, 10) || "",
    educations: list(item.educations ?? item.education_level).map((education, index) => {
      const uuid = education.education_level_uuid || resolve(education.code ?? education.education_level_name, "education");
      const level = (references.education || []).find(option => option.uuid === uuid);
      return {
        ...education,
        id: education.id || education.uuid || `education-${index}`,
        institution: education.institution ?? education.institution_name ?? "",
        enrollment_year: String(education.enrollment_year ?? education.start_year ?? ""),
        graduation_year: String(education.graduation_year ?? education.end_year ?? ""),
        education_level_uuid: uuid,
        education_level_order: Number(education.education_level_order ?? level?.level_order ?? 0),
        is_last_education: education.is_last_education ?? education.last_education ?? education.is_latest ?? false,
        major: education.major ?? "",
      };
    }),
  };
};
