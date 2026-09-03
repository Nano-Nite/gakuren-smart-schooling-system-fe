import { useState } from 'react'
import { BookOpenCheck, ClipboardCheck, Database, FileCheck2, LockKeyhole, School, ShieldCheck, UserCheck, Users, UsersRound, WalletCards } from 'lucide-react'

const problems = [
  ['Data sulit ditemukan', 'Data siswa, pegawai, kelas, dan kehadiran sering tersimpan dalam file atau aplikasi yang berbeda.', Database],
  ['Pengajuan mudah terlewat', 'Izin dan persetujuan sulit dipantau ketika hanya disampaikan melalui kertas atau pesan pribadi.', ClipboardCheck],
  ['Rekap memakan waktu', 'Operator harus mengumpulkan dan memeriksa ulang data sebelum laporan dapat digunakan.', FileCheck2],
]
const features = [
  ['Data sekolah', 'Kelola data siswa, guru, staf, kelas, mata pelajaran, tahun ajaran, dan akun pengguna.', UsersRound, 'Tersedia'],
  ['Kehadiran', 'Catat dan pantau kehadiran siswa, guru, dan staf berdasarkan waktu, lokasi, serta perangkat.', UserCheck, 'Tersedia'],
  ['Perizinan dan persetujuan', 'Kelola pengajuan izin dan pemeriksaan bertahap sesuai kewenangan setiap pengguna.', ClipboardCheck, 'Tersedia'],
  ['Penggajian', 'Hitung gaji, tunjangan, dan potongan pegawai menggunakan data yang telah tercatat.', WalletCards, 'Sedang Dikembangkan'],
  ['Jurnal guru', 'Catat jadwal mengajar, kehadiran kelas, materi yang disampaikan, dan kegiatan pembelajaran.', BookOpenCheck, 'Pengembangan Berikutnya'],
  ['Akademik dan rapor', 'Kelola materi, tugas, soal, ujian, nilai, dan penyusunan rapor.', School, 'Pengembangan Berikutnya'],
  ['Hak akses', 'Atur menu dan tindakan yang dapat digunakan oleh setiap peran.', ShieldCheck, 'Tersedia'],
  ['Laporan', 'Siapkan rekap kehadiran dan administrasi sekolah dari data yang telah tercatat.', FileCheck2, 'Tersedia'],
]
const steps = [
  ['Data sekolah disiapkan', 'Operator mengelola data siswa, pegawai, kelas, mata pelajaran, akun, dan hak akses.', Users],
  ['Kegiatan dicatat', 'Guru dan staf mencatat kehadiran serta menjalankan tugas melalui menu masing-masing.', UserCheck],
  ['Data diperiksa', 'Pengajuan dan catatan yang memerlukan persetujuan diperiksa oleh pihak yang berwenang.', ShieldCheck],
  ['Data digunakan kembali', 'Kehadiran dapat digunakan untuk penggajian. Kegiatan belajar dapat digunakan untuk penilaian dan rapor.', Database],
  ['Laporan disiapkan', 'Operator dan pimpinan dapat melihat rekap tanpa mengumpulkan kembali data dari setiap bagian.', FileCheck2],
]
const connections = [
  'Kehadiran pegawai menjadi bagian dari perhitungan gaji.',
  'Jadwal mengajar terhubung dengan jurnal dan kehadiran kelas.',
  'Nilai tugas dan ujian digunakan dalam penyusunan rapor.',
]
const roles = {
  'Kepala Sekolah dan Yayasan': 'Lihat ringkasan kehadiran, pengajuan, kegiatan mengajar, data pegawai, penggajian, dan laporan sesuai akses yang diberikan.',
  'Guru dan Staf': 'Catat kehadiran, ajukan izin, lihat jadwal, dan selesaikan tugas sesuai peran.',
  'Wali Kelas': 'Pantau kehadiran, perizinan, perkembangan nilai, dan catatan siswa.',
  Operator: 'Kelola data sekolah, akun, kelas, jadwal, pengajuan, dan laporan.',
  'Siswa dan Orang Tua': 'Lihat kehadiran, jadwal, materi, tugas, hasil ujian, dan informasi rapor sesuai akses yang diberikan.',
}
const security = ['Validasi waktu dan lokasi', 'Pengenalan perangkat', 'Hak akses berdasarkan peran', 'Persetujuan bertahap', 'Riwayat aktivitas', 'Pemisahan data setiap sekolah']
const reports = [
  ['Kehadiran', ['Rekap Hadir, Izin, Sakit, dan Alpa', 'Persentase kehadiran siswa', 'Rekap kehadiran guru dan staf'], 'Tersedia'],
  ['Penggajian', ['Rekap gaji', 'Tunjangan dan potongan', 'Slip gaji'], 'Sedang Dikembangkan'],
  ['Akademik', ['Rekap kegiatan belajar', 'Nilai tugas dan ujian', 'Data pendukung rapor'], 'Pengembangan Berikutnya'],
  ['Administrasi', ['Rekap kelas', 'Laporan kepala sekolah', 'Laporan yayasan', 'Unduh dalam format Excel'], 'Tersedia'],
]

function Title({ eyebrow, title, desc, dark = false }) {
  return <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600 dark:text-brand-200">{eyebrow}</p><h2 className={`mt-4 text-3xl font-bold tracking-[-.03em] sm:text-4xl ${dark ? 'text-white' : 'text-slate-950 dark:text-white'}`}>{title}</h2>{desc && <p className={`mt-4 max-w-2xl leading-7 ${dark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>{desc}</p>}</div>
}
function StatusLabel({ children }) { return <span className="status-label">{children}</span> }

export default function LandingSections() {
  const [role, setRole] = useState('Kepala Sekolah dan Yayasan')
  const moveTab = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const tabs = [...event.currentTarget.parentElement.querySelectorAll('[role="tab"]')]
    const current = tabs.indexOf(event.currentTarget)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[next].focus()
    tabs[next].click()
  }
  return <>
    <section id="solusi" className="landing-section bg-white py-24 dark:bg-slate-950"><div className="landing-wrap"><Title eyebrow="Tantangan di sekolah" title="Data yang terpisah membuat pekerjaan semakin panjang." desc="Informasi siswa, pegawai, kehadiran, pengajuan, dan laporan sering dikelola di tempat yang berbeda. Gakuren menyatukannya agar lebih mudah ditemukan dan diperiksa."/><div className="mt-10 grid gap-4 md:grid-cols-3">{problems.map(([title, desc, Icon]) => <article key={title} className="landing-card"><Icon size={22} className="text-brand-600"/><h3 className="!mt-4">{title}</h3><p>{desc}</p></article>)}</div><div className="mt-16"><Title eyebrow="Fitur Gakuren" title="Kelola pekerjaan sekolah dari satu tempat." desc="Setiap bagian menggunakan data yang sama sehingga pekerjaan tidak perlu dicatat berulang kali."/><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([title, desc, Icon, status]) => <article key={title} className="landing-card"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200"><Icon size={20}/></span><h3 className="!mt-0">{title}</h3></div><StatusLabel>{status}</StatusLabel><p>{desc}</p></article>)}</div></div></div></section>
    <section id="cara-kerja" className="landing-section bg-slate-50 py-24 dark:bg-slate-900"><div className="landing-wrap"><Title eyebrow="Cara kerja" title="Satu data dapat digunakan untuk beberapa pekerjaan."/><ol className="relative mt-10 grid gap-0 lg:grid-cols-5 lg:gap-4">{steps.map(([title, desc, Icon], index) => <li key={title} className="relative grid grid-cols-[48px_1fr] gap-3 pb-7 last:pb-0 lg:block lg:pb-0"><div className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">0{index + 1}</div>{index < steps.length - 1 && <span aria-hidden="true" className="absolute left-[21px] top-11 h-[calc(100%-44px)] w-px bg-brand-200 lg:left-11 lg:top-[21px] lg:h-px lg:w-[calc(100%-28px)]"/>}<div className="pt-1 lg:pt-0"><Icon size={20} className="hidden text-brand-600 lg:mt-5 lg:block"/><h3 className="font-bold text-slate-950 dark:text-white lg:mt-4">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{desc}</p></div></li>)}</ol></div></section>
    <section className="landing-section bg-white py-24 dark:bg-slate-950"><div className="landing-wrap"><Title eyebrow="Data yang saling terhubung" title="Pekerjaan tidak perlu dicatat dua kali." desc="Data kehadiran dapat digunakan dalam penggajian. Jurnal guru terhubung dengan materi dan kegiatan kelas. Nilai tugas dan ujian dapat digunakan saat menyusun rapor."/><div className="mt-10 grid gap-4 md:grid-cols-3">{connections.map((copy, index) => <article key={copy} className="landing-card"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">0{index + 1}</span><p className="!mt-4 font-semibold text-slate-800 dark:text-slate-100">{copy}</p></article>)}</div></div></section>
    <section id="dampak" className="landing-section bg-slate-50 py-24 dark:bg-slate-900"><div className="landing-wrap"><Title eyebrow="Untuk setiap pengguna" title="Setiap pengguna mendapat akses sesuai tugasnya." desc="Menu dan informasi disesuaikan dengan tanggung jawab masing-masing pengguna."/><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"><div role="tablist" aria-label="Peran pengguna" className="landing-tabs flex gap-2 overflow-x-auto p-1 pb-2">{Object.keys(roles).map((item) => <button key={item} id={`tab-${item.replaceAll(' ', '-')}`} role="tab" aria-selected={role === item} aria-controls="role-panel" tabIndex={role === item ? 0 : -1} onKeyDown={moveTab} onClick={() => setRole(item)} className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${role === item ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item}</button>)}</div><div id="role-panel" role="tabpanel" aria-labelledby={`tab-${role.replaceAll(' ', '-')}`} tabIndex="0" className="m-1 mt-3 rounded-xl bg-brand-50 p-6 text-base font-semibold leading-7 text-slate-900 dark:bg-slate-900 dark:text-white"><School className="mb-3 text-brand-600"/>{roles[role]}</div></div></div></section>
    <section id="keamanan" className="landing-section bg-[#07111f] py-24 text-white"><div className="landing-wrap grid gap-10 lg:grid-cols-[1fr_.9fr]"><div><Title dark eyebrow="Keamanan data" title="Akses dibatasi dan setiap perubahan dapat ditelusuri." desc="Setiap pengguna hanya dapat membuka menu yang sesuai dengan tugasnya. Aktivitas penting disimpan agar perubahan data dapat diperiksa kembali."/><ul className="mt-8 grid gap-3 sm:grid-cols-2">{security.map((item) => <li key={item} className="flex items-center gap-3 text-sm font-semibold"><LockKeyhole size={17} className="shrink-0 text-brand-200"/>{item}</li>)}</ul></div><div className="self-center rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-sm font-bold">Riwayat persetujuan</p>{[['07:12', 'Kehadiran dicatat', 'Selesai'], ['07:14', 'Validasi perangkat', 'Selesai'], ['07:18', 'Persetujuan wali kelas', 'Menunggu']].map(([time, label, status]) => <div key={label} className="mt-4 grid grid-cols-[42px_1fr_auto] items-center gap-3 border-t border-white/10 pt-4 text-xs"><span className="text-slate-400">{time}</span><span className="font-semibold">{label}</span><span className={status === 'Selesai' ? 'text-emerald-300' : 'text-amber-300'}>{status}</span></div>)}</div></div></section>
    <section className="landing-section bg-slate-50 py-24 dark:bg-slate-900"><div className="landing-wrap"><Title eyebrow="Laporan sekolah" title="Data harian tersusun menjadi laporan." desc="Operator dapat menyiapkan rekap tanpa mengumpulkan kembali data dari setiap bagian."/><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{reports.map(([group, items, status]) => <article key={group} className="rounded-2xl bg-white p-5 dark:bg-slate-950"><h3 className="font-bold text-slate-950 dark:text-white">{group}</h3><StatusLabel>{status}</StatusLabel><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><FileCheck2 size={16} className="mt-0.5 shrink-0 text-brand-600"/>{item}</li>)}</ul></article>)}</div><p className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-100">Gakuren membantu operator menyiapkan data untuk diperiksa. Pengiriman ke Dapodik tetap mengikuti mekanisme dan izin resmi.</p></div></section>
  </>
}
