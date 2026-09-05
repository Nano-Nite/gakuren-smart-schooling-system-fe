import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const links = [['Fitur', '#solusi'], ['Cara Kerja', '#cara-kerja'], ['Pengguna', '#dampak'], ['Keamanan', '#keamanan'], ['Harga', '#harga'], ['Rencana Pengembangan', '#roadmap']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  useEffect(() => {
    let frame = null
    let direction = 0
    let distance = 0
    lastY.current = window.scrollY
    if (open) setHidden(false)
    const update = () => {
      const y = Math.max(0, window.scrollY)
      const delta = y - lastY.current
      lastY.current = y
      frame = null
      if (open || y <= 120) { setHidden(false); distance = 0; return }
      if (!delta) return
      const nextDirection = Math.sign(delta)
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta)
      direction = nextDirection
      if (distance >= 16) { setHidden(direction > 0); distance = 0 }
    }
    const onScroll = () => { if (frame === null) frame = window.requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [open])
  return <header className={`sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 text-white backdrop-blur-md transition-transform duration-[200ms] ease-in-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`}><nav aria-label="Navigasi utama" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] lg:px-8"><Link to="/" aria-label="Gakuren, beranda" className="flex items-center gap-2.5 font-bold"><img src="/favicon.svg" alt="" className="h-8 w-8"/>Gakuren</Link><div className="hidden items-center gap-7 lg:flex">{links.map(([label, href]) => <a key={href} href={href} className="text-sm font-medium text-slate-300 hover:text-white">{label}</a>)}</div><div className="hidden items-center gap-3 lg:flex"><ThemeToggle/><Link to="/login" className="px-3 py-2 text-sm font-semibold">Masuk</Link><a href="#demo" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold hover:bg-brand-400">Lihat Demo</a></div><div className="flex items-center gap-1 lg:hidden"><ThemeToggle/><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Tutup menu' : 'Buka menu'} className="grid h-11 w-11 place-items-center rounded-lg">{open ? <X/> : <Menu/>}</button></div></nav>{open && <div id="mobile-menu" className="border-t border-white/10 bg-[#07111f] px-5 py-5 lg:hidden"><div className="flex flex-col gap-1">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-200 hover:bg-white/5">{label}</a>)}<Link to="/login" className="mt-2 flex min-h-11 items-center border-t border-white/10 px-3 pt-2 text-sm font-semibold">Masuk</Link><a href="#demo" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-semibold">Lihat Demo</a></div></div>}</header>
}
