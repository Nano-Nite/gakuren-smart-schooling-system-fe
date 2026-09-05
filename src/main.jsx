import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PageLoadingProvider } from './context/PageLoadingContext.jsx'
import { LocaleProvider } from './context/LocaleContext.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import PwaInstallBanner from './components/PwaInstallBanner.jsx'
import NetworkStatusMonitor from './components/NetworkStatusMonitor.jsx'
import OfflineAttendanceSync from './components/OfflineAttendanceSync.jsx'

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      console.info('Versi baru Gakuren tersedia | akan diperbarui otomatis.')
    },
    onOfflineReady() {
      console.info('Gakuren siap digunakan secara offline.')
    },
  })
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocaleProvider><ThemeProvider><PageLoadingProvider><NetworkStatusMonitor /><OfflineAttendanceSync /><OfflineBanner /><PwaInstallBanner /><App /></PageLoadingProvider></ThemeProvider></LocaleProvider>
  </React.StrictMode>
)
