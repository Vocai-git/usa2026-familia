import express from 'express'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const app = express()
app.use(express.json({ limit: '2mb' }))

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

// Claude — lee e interpreta los documentos subidos
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

// ─── Proxy Queue-Times (evita CORS del browser) ──────────────────────────────
app.get('/api/park/:id/times', async (req, res) => {
  try {
    const r = await fetch(`https://queue-times.com/parks/${req.params.id}/queue_times.json`)
    if (!r.ok) return res.status(r.status).json({ error: 'API no disponible' })
    const data = await r.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar Queue-Times' })
  }
})

// ─── Background polling: cada 30s ────────────────────────────────────────────
const PARK_IDS = [334, 65, 64]
const PARK_NAMES = { 334: 'Epic Universe', 65: 'Universal Studios', 64: 'Islands of Adventure' }
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

      // ── Alarma global: avisa cualquier atracción bajo el umbral ──
      if (alarm.type === 'global') {
        const rides = parkCache[alarm.parkId]
        if (!rides) continue
        for (const [rideId, ride] of Object.entries(rides)) {
          if (!ride.open || ride.wait == null || ride.wait >= alarm.threshold) continue
          const firedKey = `${sub.endpoint}_g_${alarm.parkId}_${rideId}`
          const lastFired = firedCache[firedKey] || 0
          if (Date.now() - lastFired < 10 * 60 * 1000) continue
          firedCache[firedKey] = Date.now()
          try {
            await webpush.sendNotification(pushSub, JSON.stringify({
              title: `🟢 ${ride.wait} min — ${ride.name}`,
              body: `¡Fila corta en ${PARK_NAMES[alarm.parkId] || 'el parque'}!`,
              tag: `g-${alarm.parkId}-${rideId}`
            }))
          } catch (e) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          }
        }
        continue
      }

      // ── Alarma por atracción individual ──
      const rides = parkCache[alarm.parkId]
      if (!rides) continue
      const ride = rides[alarm.rideId]
      if (!ride?.open || ride.wait == null) continue
      if (ride.wait > alarm.threshold) continue

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
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }
}

setInterval(pollAndNotify, 30 * 1000)

// ─── IA: interpretar un documento subido y cargar datos ───────────────────────
const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    doc_type: { type: 'string', enum: ['passport', 'esta', 'insurance', 'voucher', 'ticket', 'boarding_pass', 'license', 'other'] },
    title: { type: 'string', description: 'Nombre corto y claro del documento, ej "Pasaporte ESP · Agustín" o "Vuelo Iberia · Madrid→Miami"' },
    owner_name: { type: ['string', 'null'], description: 'Nombre de la persona titular si se identifica, si no null' },
    notes: { type: 'string', description: 'Datos clave: números de documento, localizador, fechas de vencimiento/check-in, teléfonos' },
    is_qr: { type: 'boolean', description: 'true si es un QR o código de barras para escanear (boarding pass, entrada)' },
    codes: {
      type: 'array',
      description: 'Localizadores, números de reserva/confirmación, códigos de check-in',
      items: {
        type: 'object', additionalProperties: false,
        properties: { label: { type: 'string' }, code: { type: 'string' }, sub_info: { type: ['string', 'null'] } },
        required: ['label', 'code', 'sub_info']
      }
    },
    events: {
      type: 'array',
      description: 'Eventos del itinerario que surjan del documento (vuelos, check-in hotel, recogida coche, embarque crucero)',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
          time: { type: ['string', 'null'], description: 'Hora HH:MM o null' },
          type: { type: 'string', enum: ['flight', 'hotel', 'car', 'park', 'cruise', 'restaurant', 'show', 'transfer', 'other'] },
          title: { type: 'string' },
          location_name: { type: ['string', 'null'] },
          location_address: { type: ['string', 'null'] }
        },
        required: ['date', 'time', 'type', 'title', 'location_name', 'location_address']
      }
    }
  },
  required: ['doc_type', 'title', 'owner_name', 'notes', 'is_qr', 'codes', 'events']
}

const MEDIA = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }

async function buildContentBlock(url, ext) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`No pude bajar el archivo (${r.status})`)
  if (ext === 'pdf') {
    const b64 = Buffer.from(await r.arrayBuffer()).toString('base64')
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
  }
  if (ext === 'html' || ext === 'htm' || ext === 'txt') {
    let text = await r.text()
    text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return { type: 'text', text: text.slice(0, 40000) }
  }
  if (MEDIA[ext]) {
    const b64 = Buffer.from(await r.arrayBuffer()).toString('base64')
    return { type: 'image', source: { type: 'base64', media_type: MEDIA[ext], data: b64 } }
  }
  throw new Error(`Formato no soportado: ${ext}`)
}

app.post('/api/parse-document', async (req, res) => {
  const { storagePath, familyId, fileName } = req.body || {}
  if (!storagePath || !familyId) return res.status(400).json({ error: 'Faltan datos' })

  const ext = storagePath.split('.').pop().toLowerCase()
  const { data: pub } = supabase.storage.from('documents').getPublicUrl(storagePath)

  let extracted = null
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY')
    const block = await buildContentBlock(pub.publicUrl, ext)
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      thinking: { type: 'disabled' },
      system: 'Sos un asistente que lee documentos de un viaje familiar a USA (pasaportes, ESTA, seguros, vuelos, hoteles, coches de alquiler, crucero, entradas a parques). Clasificá el documento y extraé los datos clave. Convertí todas las fechas a formato YYYY-MM-DD (el viaje es en 2026). Los "codes" son SOLO localizadores de reserva, números de confirmación o códigos de check-in de viajes (vuelos, hoteles, coches, crucero, entradas). NO incluyas números de pasaporte/DNI/licencia, números de solicitud ESTA, ni líneas MRZ como codes: esos datos van en "notes". Si el documento implica eventos del itinerario (vuelo, check-in de hotel, recogida o devolución de coche, embarque de crucero), agregalos como "events". Si un dato no aparece, usá null. No inventes datos.',
      messages: [{ role: 'user', content: [block, { type: 'text', text: 'Clasificá este documento y extraé sus datos.' }] }],
      output_config: { format: { type: 'json_schema', schema: EXTRACT_SCHEMA } }
    })
    const txt = msg.content.find(b => b.type === 'text')?.text || '{}'
    extracted = JSON.parse(txt)
  } catch (e) {
    console.error('parse-document IA error:', e.message)
  }

  // Si la IA falló, igual guardamos el documento para no perder el archivo
  if (!extracted) {
    await supabase.from('documents').insert({
      name: fileName || 'Documento', type: 'other', storage_path: storagePath, family_id: familyId,
      notes: 'Subido sin procesar (la IA no pudo leerlo)'
    })
    return res.json({ ok: true, ai: false, summary: 'Documento guardado (sin lectura automática)' })
  }

  // Mapear titular al id de persona
  let ownerId = null
  if (extracted.owner_name) {
    const { data: people } = await supabase.from('people').select('id,name')
    const needle = extracted.owner_name.toLowerCase()
    const match = (people || []).find(p => needle.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(needle.split(' ')[0]))
    if (match) ownerId = match.id
  }

  // 1) Documento
  await supabase.from('documents').insert({
    name: extracted.title || fileName || 'Documento',
    type: extracted.doc_type || 'other',
    owner_id: ownerId,
    storage_path: storagePath,
    notes: extracted.notes || null,
    family_id: familyId
  })

  // 2) Códigos
  let nCodes = 0
  if (Array.isArray(extracted.codes) && extracted.codes.length) {
    const rows = extracted.codes.filter(c => c.code).map(c => ({
      label: c.label || extracted.title, code: c.code, sub_info: c.sub_info || null,
      people: ownerId ? [ownerId] : [], family_id: familyId
    }))
    if (rows.length) { await supabase.from('codes').insert(rows); nCodes = rows.length }
  }

  // 3) Eventos (asignar etapa por fecha)
  let nEvents = 0
  if (Array.isArray(extracted.events) && extracted.events.length) {
    const { data: stages } = await supabase.from('stages').select('id,from_date,to_date')
    const stageFor = (d) => (stages || []).find(s => d >= s.from_date && d <= s.to_date)?.id || null
    const rows = extracted.events.filter(e => e.date).map(e => ({
      stage_id: stageFor(e.date), date: e.date, time: e.time || null, type: e.type || 'other',
      title: e.title, details: {},
      location: e.location_name ? { name: e.location_name, address: e.location_address || '' } : {},
      people: ownerId ? [ownerId] : [], family_id: familyId
    }))
    if (rows.length) { await supabase.from('events').insert(rows); nEvents = rows.length }
  }

  const parts = ['📄 ' + (extracted.title || 'documento')]
  if (nCodes) parts.push(`${nCodes} código${nCodes > 1 ? 's' : ''}`)
  if (nEvents) parts.push(`${nEvents} evento${nEvents > 1 ? 's' : ''}`)
  res.json({ ok: true, ai: true, summary: parts.join(' · '), extracted: { title: extracted.title, type: extracted.doc_type, codes: nCodes, events: nEvents } })
})

// ─── Servir app estática ──────────────────────────────────────────────────────
app.use(express.static(dist))
app.get('/{*path}', (_, res) => res.sendFile(join(dist, 'index.html')))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`USA 2026 running on port ${port}`))
