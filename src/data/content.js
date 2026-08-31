import {
  CalendarCheck,
  ShieldCheck,
  Users,
  Wallet,
  LineChart,
  CloudOff,
  RefreshCw,
  Lock,
  MessageCircle,
  MapPin,
  ScanLine,
  TriangleAlert,
  FileSpreadsheet,
  Trophy,
} from 'lucide-react'

export const navLinks = [
  { label: 'Solusi', href: '#solusi' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Dampak', href: '#dampak' },
  { label: 'Roadmap', href: '#roadmap' },
]

export const trustBadges = [
  {
    icon: ShieldCheck,
    title: 'Data Terpercaya',
    desc: 'Cegah titip absen',
  },
  {
    icon: Users,
    title: 'Respons Lebih Cepat',
    desc: 'Notifikasi real-time',
  },
  {
    icon: CloudOff,
    title: 'Satu Alur Kerja',
    desc: 'Guru dan siswa',
  },
]

export const features = [
  {
    icon: MessageCircle,
    color: 'bg-blue-50 text-blue-600',
    eyebrow: 'Respons real-time',
    title: 'Orang tua langsung tahu',
    desc: 'Saat siswa tidak hadir, sekolah dapat memberi kabar lewat WhatsApp saat itu juga—bukan menunggu rekap akhir hari.',
  },
  {
    icon: TriangleAlert,
    color: 'bg-amber-50 text-amber-600',
    eyebrow: 'Kedisiplinan digital',
    title: 'Terlambat dan bolos tercatat',
    desc: 'Gantikan buku piket dengan catatan digital yang terhubung ke riwayat kehadiran dan poin tata tertib siswa.',
  },
  {
    icon: MapPin,
    color: 'bg-emerald-50 text-emerald-600',
    eyebrow: 'Integritas data',
    title: 'Kehadiran yang bisa dipercaya',
    desc: 'Geofencing dan identifikasi unik membantu mencegah titip absen, sehingga data siap menjadi dasar laporan sekolah.',
  },
  {
    icon: ScanLine,
    color: 'bg-indigo-50 text-indigo-600',
    eyebrow: 'Satu aplikasi',
    title: 'Guru dan siswa, satu alur',
    desc: 'Guru mencatat kehadirannya lalu mengabsen siswa dari dashboard kelas yang sama. Kepala sekolah memantau secara langsung.',
  },
]

export const futureCapabilities = [
  { icon: LineChart, title: 'Peringatan dini', desc: 'Temukan pola absen tidak wajar sebelum menjadi masalah yang lebih besar.' },
  { icon: FileSpreadsheet, title: 'Export siap kerja', desc: 'Rekap DHGTK, e-Rapor, dinas, BOS, dan PIP tanpa merapikan data dari nol.' },
  { icon: ShieldCheck, title: 'Pelaporan aman', desc: 'Kanal laporan bullying dengan privasi, SLA respons, dan jejak tindak lanjut.' },
  { icon: Trophy, title: 'Budaya disiplin positif', desc: 'Badge, sertifikat, dan apresiasi untuk kehadiran terbaik.' },
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
