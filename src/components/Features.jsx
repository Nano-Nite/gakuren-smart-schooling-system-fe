import { ArrowRight } from 'lucide-react'
import { features } from '../data/content'
import { useReveal } from '../hooks/useReveal'

function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${index * 320}ms` }}
      className={`reveal feature-card ${visible ? 'is-visible' : ''} rounded-2xl border border-slate-200 bg-white p-6`}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${feature.color}`}>
        <feature.icon size={20} />
      </span>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">{feature.eyebrow}</p>
      <h3 className="mt-1.5 text-base font-bold text-slate-900">{feature.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
      <a href="#cara-kerja" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        Lihat alurnya
        <ArrowRight size={14} />
      </a>
    </div>
  )
}

export default function Features() {
  const [headingRef, headingVisible] = useReveal()
  return (
    <section id="solusi" className="landing-section bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headingRef} className={`reveal mx-auto max-w-2xl text-center ${headingVisible ? 'is-visible' : ''}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Fondasi Gakuren
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dari catatan hadir menjadi respons nyata
          </h2>
          <p className="mt-3 text-slate-600">
            Satu alur sederhana untuk guru, operator, kepala sekolah, dan orang tua.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
