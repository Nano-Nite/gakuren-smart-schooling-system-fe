import { ArrowRight} from 'lucide-react'

export default function CTA() {
  return (
    <section className="px-6 pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-violet-600">
        <div className="flex flex-col items-start gap-6 px-8 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-12">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center text-white">
              <img src="/favicon.svg" alt="Gakuren logo" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                Siap Mengelola Sekolah Anda dengan Lebih Baik?
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-brand-100">
                Mulai gunakan Gakuren sekarang juga. Gratis 30 hari, tanpa kartu kredit.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end" id="coba-gratis">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-transform hover:scale-[1.02]"
            >
              Coba Gratis Sekarang
              <ArrowRight size={16} />
            </a>
            <a href="#demo" className="text-sm text-brand-100 underline underline-offset-2 hover:text-white">
              atau jadwalkan demo dengan tim kami
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
