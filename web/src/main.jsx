import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// registerType: 'autoUpdate' (vite.config.js) activates a new service
// worker in the background as soon as one's available, but that alone
// doesn't reload an already-open tab — the page keeps running whatever
// JS was already loaded into memory until it's refreshed some other
// way. For most updates that's an acceptable gap (next visit picks it
// up), but it means a real bug fix can sit deployed for a long time
// without reaching a tab someone left open, especially as an installed
// PWA that isn't closed and reopened often. 'controllerchange' fires
// exactly when the new worker takes over — reloading there closes that
// gap. Reproduced exactly this: a fix that worked in every fresh test
// still showed the old broken behavior in a session that had been open
// since before the deploy.
let reloaded = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloaded) return
  reloaded = true
  window.location.reload()
})

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
