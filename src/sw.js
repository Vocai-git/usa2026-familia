import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ─── Documentos offline: cachear /api/doc (cache-first) ──────────────────────
const DOC_CACHE = 'usa2026-docs-v1'
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.pathname !== '/api/doc') return
  event.respondWith(
    caches.open(DOC_CACHE).then(async cache => {
      const cached = await cache.match(event.request)
      if (cached) return cached
      try {
        const resp = await fetch(event.request)
        if (resp.ok) cache.put(event.request, resp.clone())
        return resp
      } catch {
        const fallback = await cache.match(event.request)
        if (fallback) return fallback
        return new Response('Documento no disponible sin conexión', { status: 503 })
      }
    })
  )
})

self.addEventListener('push', event => {
  if (!event.data) return
  const { title, body, tag } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title || '🎢 USA 2026', {
      body: body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || 'usa2026-park',
      renotify: true,
      data: { url: '/parques' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const match = cs.find(c => c.url.includes('usa2026-app-production.up.railway.app'))
      if (match) { match.focus(); return }
      clients.openWindow(event.notification.data?.url || '/parques')
    })
  )
})
