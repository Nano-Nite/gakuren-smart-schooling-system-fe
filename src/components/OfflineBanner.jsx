import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { isNetworkAvailable, setNetworkAvailable } from '../utils/api'

export default function OfflineBanner() {
  const initiallyOnline = isNetworkAvailable()
  const [status, setStatus] = useState(initiallyOnline ? null : 'offline')
  const wasOffline = useRef(!initiallyOnline)
  const hideTimer = useRef(null)

  useEffect(() => {
    const goOnline = () => setNetworkAvailable(true)
    const goOffline = () => setNetworkAvailable(false)
    const updateApplicationNetwork = event => {
      if (!event.detail.online) {
        window.clearTimeout(hideTimer.current)
        wasOffline.current = true
        setStatus('offline')
        return
      }
      if (!wasOffline.current) return
      window.clearTimeout(hideTimer.current)
      wasOffline.current = false
      setStatus('restored')
      hideTimer.current = window.setTimeout(() => setStatus(null), 5000)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('gakuren:network', updateApplicationNetwork)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('gakuren:network', updateApplicationNetwork)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  if (!status) return null

  return (
    <div role="status" className={`offline-banner fixed inset-x-0 top-0 z-[200] flex h-8 w-screen shrink-0 items-center justify-center gap-2 px-4 text-center text-xs font-semibold text-white shadow-md transition-colors duration-700 ${status === 'offline' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {status === 'offline' ? <WifiOff size={14} /> : <Wifi size={14} />}
      {status === 'offline' ? 'Anda sedang offline — periksa koneksi internet Anda.' : 'Koneksi internet kembali tersedia.'}
    </div>
  )
}
