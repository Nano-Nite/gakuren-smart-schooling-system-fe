import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { isUserAuthenticated } from './utils/api'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PageLoadingProvider } from './context/PageLoadingContext.jsx'
import { LocaleProvider } from './context/LocaleContext.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import PwaInstallBanner from './components/PwaInstallBanner.jsx'
import NetworkStatusMonitor from './components/NetworkStatusMonitor.jsx'
import OfflineAttendanceSync from './components/OfflineAttendanceSync.jsx'

// Serialize auth changes so a registration cannot outlive a logout.
let pwaSync = Promise.resolve()
const syncPwa = () => {
  pwaSync = pwaSync.catch(() => {}).then(async () => {
    const enabled = import.meta.env.PROD && isUserAuthenticated()
    document.querySelectorAll('link[rel="manifest"]').forEach(link => link.remove())
    if (enabled) {
      const manifest = document.createElement('link')
      manifest.rel = 'manifest'
      manifest.href = `${import.meta.env.BASE_URL}manifest.webmanifest`
      document.head.appendChild(manifest)
      if ('serviceWorker' in navigator) await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
    } else if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.filter(registration => {
        const worker = registration.active || registration.waiting || registration.installing
        return worker && new URL(worker.scriptURL).pathname === `${import.meta.env.BASE_URL}sw.js`
      }).map(registration => registration.unregister()))
    }
  }).catch(error => console.error('Pengaturan PWA gagal:', error))
}
window.addEventListener('gakuren:auth', syncPwa)
syncPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocaleProvider><ThemeProvider><PageLoadingProvider><NetworkStatusMonitor /><OfflineAttendanceSync /><OfflineBanner /><PwaInstallBanner /><App /></PageLoadingProvider></ThemeProvider></LocaleProvider>
  </React.StrictMode>
)
