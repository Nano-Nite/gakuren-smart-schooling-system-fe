import { useEffect, useState } from 'react'
import { CheckCircle2, Download, X } from 'lucide-react'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [status, setStatus] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem('pwa-install-banner-dismissed') === 'true') return

    let successTimer

    const handleInstallAvailable = event => {
      event.preventDefault()
      setInstallPrompt(event)
      setStatus('available')
    }

    const handleInstalled = () => {
      setInstallPrompt(null)
      setInstalling(false)
      setStatus('installed')
      successTimer = window.setTimeout(() => setStatus(null), 5000)
    }

    window.addEventListener('beforeinstallprompt', handleInstallAvailable)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable)
      window.removeEventListener('appinstalled', handleInstalled)
      window.clearTimeout(successTimer)
    }
  }, [])

  const install = async () => {
    if (!installPrompt || installing) return
    setInstalling(true)
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    setInstalling(false)

    if (outcome === 'accepted') {
      setInstallPrompt(null)
      return
    }

    setStatus('available')
  }

  const dismiss = () => {
    sessionStorage.setItem('pwa-install-banner-dismissed', 'true')
    setStatus(null)
  }

  if (!status) return null

  const installed = status === 'installed'

  return (
    <div className="fixed inset-x-3 bottom-3 z-[190] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-blue-200 bg-white p-3.5 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:bottom-5 sm:p-4" role="status">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${installed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'}`}>
        {installed ? <CheckCircle2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{installed ? 'Gakuren berhasil dipasang' : 'Pasang aplikasi Gakuren'}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{installed ? 'Aplikasi sekarang dapat dibuka langsung dari perangkat Anda.' : 'Akses lebih cepat dan gunakan fitur offline dari layar utama.'}</p>
      </div>
      {!installed && <button type="button" onClick={install} disabled={installing} className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{installing ? 'Memasang…' : 'Pasang'}</button>}
      <button type="button" onClick={dismiss} aria-label="Tutup notifikasi pemasangan" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-4 w-4" /></button>
    </div>
  )
}
