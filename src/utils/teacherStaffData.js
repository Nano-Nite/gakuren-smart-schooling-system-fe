export const formatTeacherStaffStatus = value => ({ active: "Aktif", inactive: "Nonaktif", pending: "Pending", new_user: "Pengguna Baru", "new user": "Pengguna Baru", "new-user": "Pengguna Baru" })[String(value).toLowerCase()] || value || "-";

export const normalizeTeacherStaff = item => {
  const titles = [...(item.titles || [])].sort((a, b) => Number(a.sequence) - Number(b.sequence));
  return {
    ...item,
    id: item.uuid,
    position: item.positions?.join(", ") || item.occupation || "-",
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
