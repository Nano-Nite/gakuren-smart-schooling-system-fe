export function isNewUserStatus(status) {
  return ["newuser", "penggunabaru"].includes(String(status ?? "").trim().toLowerCase().replace(/[\s_-]+/g, ""));
}

export const deactivationConsequences = [
  "Status data menjadi Nonaktif. Data tetap tersimpan, bukan dihapus permanen.",
  "Data tidak muncul saat filter status Aktif digunakan. Pilih Nonaktif atau Semua Status untuk melihatnya.",
  "Pengguna dengan izin yang sesuai dapat mengaktifkan kembali data melalui tindakan Aktifkan.",
];

export function isStatusMutationBlocked(status) {
  return isNewUserStatus(status) || ["pending", "menunggu"].includes(String(status ?? "").trim().toLowerCase());
}
