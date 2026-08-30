import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PageLoadingProvider } from './context/PageLoadingContext.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import PwaInstallBanner from './components/PwaInstallBanner.jsx'

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      console.info('Versi baru Gakuren tersedia — akan diperbarui otomatis.')
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
    <ThemeProvider><PageLoadingProvider><OfflineBanner /><PwaInstallBanner /><App /></PageLoadingProvider></ThemeProvider>
  </React.StrictMode>
)
