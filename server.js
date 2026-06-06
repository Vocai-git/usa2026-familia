import express from 'express'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const app = express()
app.use(express.json())

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, 'dist')

// VAPID
webpush.setVapidDetails(
  'mailto:moledoec@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Supabase (server-side, usa anon key — RLS pública)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// ─── API: exponer VAPID public key al frontend ───────────────────────────────
app.get('/api/push/vapid-key', (_, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// ─── API: guardar suscripción ─────────────────────────────────────────────────
app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, alarms } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Sin endpoint' })

  await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    alarms: alarms || {}
  }, { onConflict: 'endpoint' })

  res.json({ ok: true })
})

// ─── API: sincronizar alarmas ─────────────────────────────────────────────────
app.post('/api/push/sync', async (req, res) => {
  const { endpoint, alarms } = req.body
  if (!endpoint) return res.status(400).json({ error: 'Sin endpoint' })

  await supabase.from('push_subscriptions')
    .update({ alarms: alarms || {}, updated_at: new Date().toISOString() })
    .eq('endpoint', endpoint)

  res.json({ ok: true })
})

// ─── API: desuscribirse ───────────────────────────────────────────────────────
app.delete('/api/push/subscribe', async (req, res) => {
  const { endpoint } = req.body
  if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  res.json({ ok: true })
})

// ─── Background polling: cada 30s ────────────────────────────────────────────
const PARK_IDS = [334, 65, 64]
const parkCache = {}
const firedCache = {} // endpoint_rideKey → timestamp última notificación

async function fetchPark(parkId) {
  try {
    const r = await fetch(`https://queue-times.com/parks/${parkId}/queue_times.json`)
    if (!r.ok) return null
    const data = await r.json()
    const rides = {}
    for (const land of data.lands || []) {
      for (const ride of land.rides || []) {
        rides[ride.id] = { name: ride.name, wait: ride.wait_time, open: ride.is_open }
      }
    }
    return rides
  } catch { return null }
}

async function pollAndNotify() {
  // Obtener todas las suscripciones con alarmas activas
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (!subs?.length) return

  // Fetch parks que tienen alarmas activas
  const neededParks = new Set()
  for (const sub of subs) {
    for (const alarm of Object.values(sub.alarms || {})) {
      if (alarm.active) neededParks.add(alarm.parkId)
    }
  }
  if (!neededParks.size) return

  for (const parkId of neededParks) {
    parkCache[parkId] = await fetchPark(parkId)
  }

  // Revisar alarmas por suscripción
  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    }

    for (const [key, alarm] of Object.entries(sub.alarms || {})) {
      if (!alarm.active) continue
      const rides = parkCache[alarm.parkId]
      if (!rides) continue
      const ride = rides[alarm.rideId]
      if (!ride?.open || ride.wait == null) continue
      if (ride.wait > alarm.threshold) continue

      // Anti-spam: no notificar más de 1 vez cada 10 min por atracción
      const firedKey = `${sub.endpoint}_${key}`
      const lastFired = firedCache[firedKey] || 0
      if (Date.now() - lastFired < 10 * 60 * 1000) continue

      firedCache[firedKey] = Date.now()

      try {
        await webpush.sendNotification(pushSub, JSON.stringify({
          title: `🎢 ${ride.wait} min — ${alarm.rideName}`,
          body: `¡La fila bajó a ${ride.wait} minutos!`,
          tag: `ride-${alarm.rideId}`
        }))
      } catch (e) {
        // Suscripción inválida/expirada — eliminar
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }
}

setInterval(pollAndNotify, 30 * 1000)

// ─── Servir app estática ──────────────────────────────────────────────────────
app.use(express.static(dist))
app.get('*', (_, res) => res.sendFile(join(dist, 'index.html')))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`USA 2026 running on port ${port}`))
