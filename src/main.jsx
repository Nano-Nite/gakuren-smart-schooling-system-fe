import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

registerSW({
  onNeedRefresh() {
    console.info('Versi baru Gakuren tersedia — akan diperbarui otomatis.')
  },
  onOfflineReady() {
    console.info('Gakuren siap digunakan secara offline.')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
