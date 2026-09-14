import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { isNetworkAvailable, setNetworkAvailable } from '../utils/api'

const formatRetryTime = totalSeconds => {
  if (totalSeconds < 60) return `${totalSeconds} detik`
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return seconds ? `${minutes} menit ${seconds} detik` : `${minutes} menit`
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return minutes ? `${hours} jam ${minutes} menit` : `${hours} jam`
}

export default function OfflineBanner() {
  const initiallyOnline = isNetworkAvailable()
  const [status, setStatus] = useState(initiallyOnline ? null : 'offline')
  const [retry, setRetry] = useState({ seconds: 0, checking: false })
  const [animation, setAnimation] = useState(initiallyOnline ? 'hidden' : 'entering')
  const wasOffline = useRef(!initiallyOnline)
  const hideTimer = useRef(null)
  const exitTimer = useRef(null)
  const animationFrame = useRef(null)

  useEffect(() => {
    const slideIn = () => {
      window.cancelAnimationFrame(animationFrame.current)
      document.getElementById('root')?.classList.add('network-banner-visible')
      setAnimation('entering')
      animationFrame.current = window.requestAnimationFrame(() => {
        animationFrame.current = window.requestAnimationFrame(() => setAnimation('visible'))
      })
    }
    if (!initiallyOnline) slideIn()
    const goOffline = () => setNetworkAvailable(false)
    const updateApplicationNetwork = event => {
      if (!event.detail.online) {
        window.clearTimeout(hideTimer.current)
        window.clearTimeout(exitTimer.current)
        const enteringOffline = !wasOffline.current
        wasOffline.current = true
        setStatus('offline')
        if (enteringOffline) slideIn()
        return
      }
      if (!wasOffline.current) return
      window.clearTimeout(hideTimer.current)
      window.clearTimeout(exitTimer.current)
      wasOffline.current = false
      setStatus('restored')
      setAnimation('visible')
      // Five seconds total: visible for four seconds, then slide out for one.
      exitTimer.current = window.setTimeout(() => {
        setAnimation('exiting')
        document.getElementById('root')?.classList.remove('network-banner-visible')
      }, 4000)
      hideTimer.current = window.setTimeout(() => {
        setStatus(null)
        setAnimation('hidden')
      }, 5000)
    }
    const updateRetry = event => setRetry(event.detail)
    window.addEventListener('offline', goOffline)
    window.addEventListener('gakuren:network', updateApplicationNetwork)
    window.addEventListener('gakuren:network-retry', updateRetry)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('gakuren:network', updateApplicationNetwork)
      window.removeEventListener('gakuren:network-retry', updateRetry)
      window.clearTimeout(hideTimer.current)
      window.clearTimeout(exitTimer.current)
      window.cancelAnimationFrame(animationFrame.current)
      document.getElementById('root')?.classList.remove('network-banner-visible')
    }
  }, [])

  if (!status) return null

  return (
    <div role="status" className={`offline-banner fixed inset-x-0 top-0 z-[200] flex min-h-8 w-screen shrink-0 flex-wrap items-center justify-center gap-x-2 px-4 py-1 text-center text-xs font-semibold text-white shadow-md transition-[transform,opacity,background-color] duration-[1000ms] ease-in-out ${animation === 'visible' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${status === 'offline' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {status === 'offline' ? <WifiOff size={14} /> : <Wifi size={14} />}
      {status === 'offline' ? 'Anda sedang luring | periksa koneksi internet Anda.' : 'Koneksi internet kembali tersedia.'}
      {status === 'offline' && <><span className="text-red-100">{retry.checking ? 'Memeriksa server…' : `Coba lagi dalam ${formatRetryTime(retry.seconds)}`}</span><button type="button" disabled={retry.checking} onClick={() => window.dispatchEvent(new Event('gakuren:network-retry-now'))} className="rounded-md border border-white/60 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-white/20 disabled:cursor-wait disabled:opacity-60">Coba sekarang</button></>}
    </div>
  )
}
