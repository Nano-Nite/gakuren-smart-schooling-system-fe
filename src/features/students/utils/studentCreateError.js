export function getStudentCreateErrorMessage(error) {
  const normalize = value => String(value || "").trim().toLowerCase();
  const reason = normalize(error?.serverError);
  const message = normalize(error?.message);
  if ([reason, message].includes("multiple user found")) {
    return "Siswa gagal ditambahkan karena ditemukan lebih dari satu akun pengguna saat pemeriksaan data. Hubungi administrator sekolah untuk memeriksa data akun yang duplikat.";
  }
  if (["fail to check user", "failed to check user"].includes(message)) {
    return "Siswa gagal ditambahkan karena pemeriksaan akun pengguna gagal. Silakan coba lagi. Jika masalah berlanjut, hubungi administrator sekolah.";
  }
  return error?.message || "Siswa gagal ditambahkan. Silakan coba lagi.";
}
