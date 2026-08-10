import { ArrowRight } from 'lucide-react'
import { features } from '../data/content'
import { useReveal } from '../hooks/useReveal'

function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${(index % 4) * 60}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} rounded-2xl border border-slate-200 p-6 transition-shadow hover:shadow-card`}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${feature.color}`}>
        <feature.icon size={20} />
      </span>
      <h3 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
      <a href="#fitur" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        Pelajari lebih lanjut
        <ArrowRight size={14} />
      </a>
    </div>
  )
}

export default function Features() {
  return (
    <section id="fitur" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Fitur Unggulan
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Semua yang Sekolah Anda Butuhkan
          </h2>
          <p className="mt-3 text-slate-600">
            Dirancang khusus untuk memudahkan pengelolaan sekolah dari ujung ke ujung.
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
