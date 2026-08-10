import { ArrowRight, Play } from 'lucide-react'
import DashboardPreview from './DashboardPreview'
import { trustBadges } from '../data/content'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute right-0 top-0 h-[560px] w-[560px] -translate-y-1/4 translate-x-1/4 rounded-full bg-brand-50" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Aplikasi Manajemen Sekolah Modern
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Kelola Kehadiran,
            <br />
            <span className="text-brand-600">Sederhanakan Sekolah.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Gakuren membantu sekolah mengelola absensi, izin, penggajian guru, hingga
            laporan dalam satu platform yang aman, mudah digunakan, dan terintegrasi.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#coba-gratis"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Coba Gratis 30 Hari
              <ArrowRight size={16} />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Lihat Demo
              <Play size={14} />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {trustBadges.map((b) => (
              <div key={b.title} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <b.icon size={16} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{b.title}</p>
                  <p className="text-[11px] text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-float">
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}
