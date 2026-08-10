export default function Footer() {
  return (
    <footer className="border-t border-slate-100 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
        <a href="#" className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className="grid h-6 w-6 place-items-center text-white">
            <img src="/favicon.svg" alt="Gakuren logo" />
          </span>
        </a>
        <p className="text-xs text-slate-500">© 2026 CodeLine. Seluruh hak cipta dilindungi.</p>
        <div className="flex gap-5 text-xs font-medium text-brand-600">
          <a href="#" className="hover:text-brand-700">Kebijakan Privasi</a>
          <a href="#" className="hover:text-brand-700">Syarat & Ketentuan</a>
        </div>
      </div>
    </footer>
  )
}
