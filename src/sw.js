import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', event => {
  if (!event.data) return
  const { title, body, tag } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title || '🎢 USA 2026', {
      body: body || '',
      icon: '/usa2026-familia/icons/icon-192.png',
      badge: '/usa2026-familia/icons/icon-192.png',
      tag: tag || 'usa2026-park',
      renotify: true,
      data: { url: '/usa2026-familia/parques' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const match = cs.find(c => c.url.includes('usa2026-familia'))
      if (match) { match.focus(); return }
      clients.openWindow(event.notification.data?.url || '/usa2026-familia/parques')
    })
  )
})
