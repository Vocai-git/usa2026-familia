import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

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
