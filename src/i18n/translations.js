export const DEFAULT_LOCALE = "id";
export const SUPPORTED_LOCALES = ["id", "en"];

export const translations = {
  id: {
    common: {
      import: "Impor", export: "Ekspor", profile: "Profil", logout: "Keluar",
      admin: "Admin", administrator: "Administrator", pending: "Menunggu",
    },
    menu: {
      Dashboard: "Dasbor", "QR Code": "Kode QR", "Teacher and Staff": "Guru dan Staf",
      "Student Management": "Siswa", "Class Management": "Kelas", Approval: "Persetujuan",
      Attendance: "Kehadiran", Absence: "Ketidakhadiran", Report: "Laporan",
      Setting: "Pengaturan", Profile: "Profil",
    },
    subtitle: {
      Dashboard: "Ringkasan aktivitas sekolah", "QR Code": "Pindai kode QR untuk mencatat kehadiran",
      "Teacher and Staff": "Kelola data guru dan staf", "Student Management": "Kelola data siswa di sekolah",
      "Class Management": "Kelola data kelas di sekolah", Approval: "Tinjau dan proses pengajuan yang menunggu persetujuan",
      Attendance: "Kelola catatan kehadiran", Absence: "Kelola catatan ketidakhadiran",
      Report: "Lihat dan ekspor laporan sekolah", Setting: "Atur aplikasi dan sekolah",
      Profile: "Kelola informasi akun", fallback: "Kelola data sekolah",
    },
  },
  en: {
    common: {
      import: "Import", export: "Export", profile: "Profile", logout: "Log out",
      admin: "Admin", administrator: "Administrator", pending: "Pending",
    },
    menu: {
      Dashboard: "Dashboard", "QR Code": "QR Code", "Teacher and Staff": "Teachers and Staff",
      "Student Management": "Students", "Class Management": "Classes", Approval: "Approvals",
      Attendance: "Attendance", Absence: "Absence", Report: "Reports", Setting: "Settings", Profile: "Profile",
    },
    subtitle: {
      Dashboard: "Overview of school activity", "QR Code": "Scan a QR code to record attendance",
      "Teacher and Staff": "Manage teachers and staff", "Student Management": "Manage student records",
      "Class Management": "Manage class records", Approval: "Review and process requests awaiting approval",
      Attendance: "Manage attendance records", Absence: "Manage absence records",
      Report: "View and export school reports", Setting: "Configure the app and school",
      Profile: "Manage account information", fallback: "Manage school data",
    },
  },
};
