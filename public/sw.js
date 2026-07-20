/* PWA SW v8: HTML siempre fresco; limpia caches viejos al activar. */
const SW_VERSION = 'dinamicas-sw-v8'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(SW_VERSION).then(() => undefined))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function offlineHtml() {
  return new Response(
    '<!doctype html><html><body style="font-family:system-ui;padding:24px"><h1>Sin conexión</h1><p>Revisa tu red e intenta de nuevo.</p><button onclick="location.reload()">Recargar</button></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  if (!sameOrigin) return

  const isNav = req.mode === 'navigate'
  const isHashedAsset =
    url.pathname.startsWith('/assets/') ||
    /\/assets\/.+\.[A-Za-z0-9_-]{6,}\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?)$/i.test(url.pathname)

  // HTML / navegación: network-only (evita pantalla blanca por shell viejo).
  if (isNav || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('/index.html')) {
    event.respondWith(fetch(req).catch(() => offlineHtml()))
    return
  }

  // Chunks/imágenes con hash en el nombre: cache-first (rápido en 3G).
  if (isHashedAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Actualiza en background.
          event.waitUntil(
            fetch(req)
              .then((res) => {
                if (res.ok) {
                  return caches.open(SW_VERSION).then((c) => c.put(req, res.clone()))
                }
              })
              .catch(() => undefined),
          )
          return cached
        }
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            event.waitUntil(caches.open(SW_VERSION).then((c) => c.put(req, copy)))
          }
          return res
        })
      }),
    )
  }
})
