import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { ErrorBoundary } from './app/components/ErrorBoundary'
import './styles/index.css'

function hideBootSplash() {
  try {
    const fn = (window as Window & { __hideBootSplash?: () => void }).__hideBootSplash
    if (typeof fn === 'function') fn()
    else document.getElementById('boot-splash')?.classList.add('is-hidden')
  } catch {
    /* ignore */
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  hideBootSplash()
  document.body.innerHTML =
    '<p style="font-family:system-ui;padding:24px">No se encontró #root. Recarga la página.</p>'
} else {
  try {
    createRoot(rootEl).render(
      <ErrorBoundary label="root">
        <App />
      </ErrorBoundary>,
    )
  } catch (error) {
    console.error('[dinamicas:boot]', error)
    hideBootSplash()
    rootEl.innerHTML =
      '<p style="font-family:system-ui;padding:24px;color:#0d3b66">No se pudo iniciar la app. Recarga la página.</p>'
  } finally {
    // Quita splash en el siguiente frame (aunque React pinte async).
    requestAnimationFrame(() => requestAnimationFrame(hideBootSplash))
    window.setTimeout(hideBootSplash, 1200)
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[dinamicas:unhandledrejection]', event.reason)
  hideBootSplash()
})

window.addEventListener('error', (event) => {
  hideBootSplash()
  const msg = String(event.message || event.error || '')
  if (/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
    const key = 'dinamicas-chunk-reload'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    }
  }
})
