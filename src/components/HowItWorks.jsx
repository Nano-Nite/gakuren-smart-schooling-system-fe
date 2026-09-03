import { ClipboardCheck, Database, FileCheck2, UserCheck, Users } from 'lucide-react'
import { useReveal } from '../hooks/useReveal'

const steps = [
  { icon: Users, number: '01', title: 'Data sekolah disiapkan', desc: 'Operator mengelola data siswa, pegawai, kelas, mata pelajaran, akun, dan hak akses.' },
  { icon: UserCheck, number: '02', title: 'Kegiatan dicatat', desc: 'Guru dan staf mencatat kehadiran serta menjalankan tugas melalui menu masing-masing.' },
  { icon: ClipboardCheck, number: '03', title: 'Data diperiksa', desc: 'Pengajuan dan catatan yang memerlukan persetujuan diperiksa oleh pihak yang berwenang.' },
  { icon: Database, number: '04', title: 'Data digunakan kembali', desc: 'Kehadiran dapat digunakan untuk penggajian. Kegiatan belajar dapat digunakan untuk penilaian dan rapor.' },
  { icon: FileCheck2, number: '05', title: 'Laporan disiapkan', desc: 'Operator dan pimpinan dapat melihat rekap tanpa mengumpulkan kembali data dari setiap bagian.' },
]

export default function HowItWorks() {
  const [ref, visible] = useReveal()
  return (
    <section id="cara-kerja" className="landing-section relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_70%_20%,#1e88e5_0,transparent_35%)]" />
      <div ref={ref} className={`reveal relative mx-auto max-w-7xl px-6 lg:px-8 ${visible ? 'is-visible' : ''}`}>
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">Cara kerja</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Satu data dapat digunakan untuk beberapa pekerjaan.</h2>
        </div>
        <div className="stagger-grid relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="stagger-decoration absolute left-10 right-10 top-9 hidden h-px bg-gradient-to-r from-brand-500/20 via-brand-400 to-brand-500/20 lg:block" />
          {steps.map((step) => (
            <article key={step.number} className="group relative">
              <div className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-slate-900 text-brand-400 shadow-xl transition group-hover:-translate-y-1 group-hover:border-brand-400/50"><step.icon size={24} /></div>
              <span className="mt-6 block text-xs font-bold tracking-[0.18em] text-brand-400">LANGKAH {step.number}</span>
              <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
