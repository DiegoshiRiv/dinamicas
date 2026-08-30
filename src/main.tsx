import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { ErrorBoundary } from './app/components/ErrorBoundary'
import './styles/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="font-family:system-ui;padding:24px">No se encontró #root. Recarga la página.</p>'
} else {
  createRoot(rootEl).render(
    <ErrorBoundary label="root">
      <App />
    </ErrorBoundary>,
  )
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[dinamicas:unhandledrejection]', event.reason)
})

window.addEventListener('error', (event) => {
  const msg = String(event.message || event.error || '')
  if (/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
    // Safari en modo privado lanza al tocar sessionStorage: sin esto el propio
    // manejador de errores reventaría y nunca se intentaría la recarga.
    const key = 'dinamicas-chunk-reload'
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* sin almacenamiento se recarga igual, asumiendo el riesgo de repetir */
    }
    window.location.reload()
  }
})
