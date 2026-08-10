import {
  CalendarCheck,
  ShieldCheck,
  Users,
  Wallet,
  LineChart,
  CloudOff,
  RefreshCw,
  Lock,
} from 'lucide-react'

export const navLinks = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Harga', href: '#harga' },
  { label: 'Integrasi', href: '#integrasi' },
  { label: 'Tentang', href: '#tentang' },
  { label: 'Bantuan', href: '#bantuan' },
]

export const trustBadges = [
  {
    icon: ShieldCheck,
    title: 'Aman & Terpercaya',
    desc: 'Data terenkripsi',
  },
  {
    icon: Users,
    title: 'Mudah Digunakan',
    desc: 'Siap dalam hitungan menit',
  },
  {
    icon: CloudOff,
    title: 'Cloud & Offline',
    desc: 'Tetap jalan tanpa internet',
  },
]

export const features = [
  {
    icon: CalendarCheck,
    color: 'bg-blue-50 text-blue-600',
    title: 'Absensi Cerdas',
    desc: 'Absensi dengan QR dinamis, GPS, verifikasi wajah, dan mode offline. Data tersinkron otomatis.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Izin & Sakit',
    desc: 'Pengajuan izin atau sakit lebih mudah dengan persetujuan berjenjang dan notifikasi real-time.',
  },
  {
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
    title: 'Manajemen Guru & Pegawai',
    desc: 'Kelola data guru dan pegawai, jabatan, kontrak, hingga riwayat kepegawaian dengan rapi.',
  },
  {
    icon: Wallet,
    color: 'bg-orange-50 text-orange-600',
    title: 'Payroll & Penggajian',
    desc: 'Hitung gaji otomatis berdasarkan kehadiran, tunjangan, potongan, dan aturan sekolah Anda.',
  },
  {
    icon: LineChart,
    color: 'bg-rose-50 text-rose-600',
    title: 'Laporan Lengkap',
    desc: 'Laporan kehadiran, izin, keterlambatan, hingga laporan payroll siap cetak dalam berbagai format.',
  },
  {
    icon: CloudOff,
    color: 'bg-sky-50 text-sky-600',
    title: 'Offline & Sinkronisasi',
    desc: 'Aplikasi tetap berjalan tanpa internet. Data akan tersinkron otomatis saat koneksi tersedia.',
  },
  {
    icon: RefreshCw,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Integrasi Dapodik',
    desc: 'Sinkron data guru, pegawai, dan siswa dari Dapodik dengan mudah dan aman.',
  },
  {
    icon: Lock,
    color: 'bg-amber-50 text-amber-600',
    title: 'Keamanan & Hak Akses',
    desc: 'Kontrol akses berbasis role & permission. Data sekolah Anda aman dan terlindungi.',
  },
]

export const testimonials = [
  {
    quote:
      'Gakuren sangat membantu kami dalam mengelola absensi dan penggajian guru. Laporan jadi lebih cepat dan akurat.',
    name: 'Nina Marlina',
    role: 'Kepala Sekolah',
    org: 'SMP Harapan Bangsa',
  },
  {
    quote:
      'Fitur offline-nya luar biasa! Absensi tetap jalan meskipun internet di sekolah sering bermasalah.',
    name: 'Agus Setiawan',
    role: 'Operator Sekolah',
    org: 'SMA Cendekia',
  },
  {
    quote:
      'Integrasi Dapodik sangat memudahkan, data guru dan siswa selalu up to date.',
    name: 'Rizky Kurnia',
    role: 'TU',
    org: 'SMK Mandiri',
  },
]

export const attendanceData = [
  { day: '1 Jun', hadir: 210 },
  { day: '5 Jun', hadir: 340 },
  { day: '10 Jun', hadir: 300 },
  { day: '15 Jun', hadir: 420 },
  { day: '20 Jun', hadir: 520 },
  { day: '25 Jun', hadir: 470 },
  { day: '30 Jun', hadir: 560 },
]

export const recentRequests = [
  { name: 'Budi Santoso', type: 'Izin', time: 'Hari ini 08:15' },
  { name: 'Maria Ulfa', type: 'Sakit', time: 'Hari ini 07:42' },
  { name: 'Ahmad Fauzi', type: 'Izin', time: 'Kemarin 16:33' },
]
