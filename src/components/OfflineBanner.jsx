import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { isNetworkAvailable, setNetworkAvailable } from '../utils/api'

export default function OfflineBanner() {
  const [online, setOnline] = useState(isNetworkAvailable())

  useEffect(() => {
    const goOnline = () => { setNetworkAvailable(true); setOnline(true) }
    const goOffline = () => { setNetworkAvailable(false); setOnline(false) }
    const updateApplicationNetwork = event => setOnline(event.detail.online)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('gakuren:network', updateApplicationNetwork)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('gakuren:network', updateApplicationNetwork)
    }
  }, [])

  if (online) return null

  return (
    <div role="status" className="offline-banner sticky inset-x-0 top-0 z-[200] flex h-8 w-full shrink-0 items-center justify-center gap-2 bg-red-600 px-4 text-center text-xs font-semibold text-white shadow-md">
      <WifiOff size={14} />
      Anda sedang offline — periksa koneksi internet Anda.
    </div>
  )
}
