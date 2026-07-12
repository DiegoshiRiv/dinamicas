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

// Errores async no capturados por React (promesas / chunks).
window.addEventListener('unhandledrejection', (event) => {
  console.error('[dinamicas:unhandledrejection]', event.reason)
})

window.addEventListener('error', (event) => {
  // Chunk load errors tras deploy: forzar recarga una vez.
  const msg = String(event.message || event.error || '')
  if (/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
    const key = 'dinamicas-chunk-reload'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    }
  }
})
