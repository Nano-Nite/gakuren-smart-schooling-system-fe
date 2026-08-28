import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { navLinks } from '../data/content'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled ? 'bg-white/90 backdrop-blur border-slate-200' : 'bg-white border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8  text-white">
            <img src="/favicon.svg" alt="Gakuren logo" />
          </span>
          Gakuren
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Masuk
          </Link>
          <a
            href="#coba-gratis"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Coba Gratis
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden"><ThemeToggle /><button
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 lg:hidden"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button></div>
      </nav>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link to="/login" className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                Masuk
              </Link>
              <a href="#coba-gratis" className="rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white">
                Coba Gratis
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
