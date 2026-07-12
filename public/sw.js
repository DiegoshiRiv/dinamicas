/* PWA SW: no cachea HTML/JS (evita pantalla blanca por assets viejos). */
const SW_VERSION = 'dinamicas-sw-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(SW_VERSION).then(() => undefined))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  const isNav = req.mode === 'navigate'
  const isAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?)$/i.test(url.pathname)

  // Navegación e index: siempre red (nunca HTML cacheado).
  if (isNav || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            '<!doctype html><html><body style="font-family:system-ui;padding:24px"><h1>Sin conexión</h1><p>Revisa tu red e intenta de nuevo.</p><button onclick="location.reload()">Recargar</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          ),
      ),
    )
    return
  }

  // Assets hasheados: network-first, fallback a cache.
  if (isAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            void caches.open(SW_VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => caches.match(req).then((c) => c || Response.error())),
    )
  }
})
