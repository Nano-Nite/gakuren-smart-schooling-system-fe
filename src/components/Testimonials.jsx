import { ArrowUpRight, HeartHandshake, School, UserRoundCheck } from 'lucide-react'
import { futureCapabilities } from '../data/content'
import { useReveal } from '../hooks/useReveal'

const outcomes = [
  { icon: UserRoundCheck, title: 'Untuk wali kelas', desc: 'Tahu siswa mana yang perlu dihubungi hari ini, tanpa membongkar rekap satu per satu.' },
  { icon: School, title: 'Untuk kepala sekolah', desc: 'Melihat kondisi operasional secara langsung dengan data kehadiran yang lebih dapat dipercaya.' },
  { icon: HeartHandshake, title: 'Untuk orang tua', desc: 'Mendapat informasi lebih cepat dan punya jalur izin yang sederhana serta terdokumentasi.' },
]

export default function Testimonials() {
  const [impactRef, impactVisible] = useReveal()
  const [roadmapRef, roadmapVisible] = useReveal()
  return (
    <>
      <section id="dampak" className="landing-section bg-white py-24">
        <div ref={impactRef} className={`reveal mx-auto max-w-7xl px-6 lg:px-8 ${impactVisible ? 'is-visible' : ''}`}>
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Yang sebenarnya kami jual</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Bukan mesin absensi.<br /><span className="text-brand-600">Sistem kepedulian siswa.</span></h2>
              <p className="mt-4 max-w-xl leading-relaxed text-slate-600">Data kehadiran hanya bernilai ketika membantu sekolah merespons lebih cepat, mengurangi pekerjaan administratif, dan mencegah siswa hilang dari perhatian.</p>
            </div>
            <div className="stagger-grid grid gap-4 sm:grid-cols-3">
              {outcomes.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                  <item.icon className="text-brand-600" size={22} />
                  <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="landing-section bg-slate-50 py-24">
        <div ref={roadmapRef} className={`reveal mx-auto max-w-7xl px-6 lg:px-8 ${roadmapVisible ? 'is-visible' : ''}`}>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Arah pengembangan</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Dari hadir hari ini, menuju masa depan siswa.</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">Fondasi absensi yang kuat membuka fitur yang membantu sekolah bekerja lebih ringan dan mengambil keputusan lebih awal.</p>
          </div>
          <div className="stagger-grid mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {futureCapabilities.map((item, index) => (
              <article key={item.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-card">
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-100">0{index + 1}</span>
                <item.icon className="relative text-violet-600" size={24} />
                <h3 className="relative mt-8 font-bold text-slate-900">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                <ArrowUpRight className="relative mt-5 text-slate-300 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-violet-600" size={18} />
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">* Fitur roadmap dikembangkan bertahap berdasarkan kesiapan produk dan kebutuhan sekolah.</p>
        </div>
      </section>
    </>
  )
}
