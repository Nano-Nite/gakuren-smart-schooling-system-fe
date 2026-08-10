import { Star, Quote } from 'lucide-react'
import { testimonials } from '../data/content'

export default function Testimonials() {
  return (
    <section id="tentang" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-slate-200">
              Dipercaya Banyak Sekolah
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
              Bersama Sekola, Sekolah Lebih Efisien
            </h2>
            <p className="mt-3 text-slate-600">
              Ribuan sekolah telah beralih ke Gakuren untuk mengelola kehadiran dan operasional sehari-hari.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-2xl font-extrabold text-slate-900">4.9/5</span>
              <span className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
              <span className="text-sm text-slate-500">(Dari 1.200+ pengguna)</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl bg-white p-6 shadow-card">
                <Quote size={22} className="text-brand-200" fill="currentColor" strokeWidth={0} />
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">{t.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}, {t.org}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
