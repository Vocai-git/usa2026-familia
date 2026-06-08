import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const TRIP_START = new Date('2026-06-10T10:00:00+02:00') // 10 jun 10:00 Madrid (CEST)
const TRIP_END   = new Date('2026-07-14T23:59:59')
const DAY = 86400000
const TOTAL_DIAS = 34

// Coordenadas por etapa (para el clima)
const STAGE_COORDS = {
  orlando: { lat: 28.474, lng: -81.468, city: 'Orlando' },
  crucero: { lat: 25.78,  lng: -80.13,  city: 'Crucero · Caribe' },
  miami:   { lat: 25.79,  lng: -80.13,  city: 'Miami' },
  ny:      { lat: 40.75,  lng: -73.99,  city: 'Nueva York' },
  ida:     { lat: 28.474, lng: -81.468, city: 'En viaje' },
  vuelta:  { lat: 25.79,  lng: -80.13,  city: 'En viaje' },
  mundial: { lat: 25.79,  lng: -80.13,  city: 'Mundial' },
}

function wmo(code) {
  if (code == null) return { e: '🌡️', t: '' }
  if (code === 0) return { e: '☀️', t: 'Despejado' }
  if (code <= 2)  return { e: '🌤️', t: 'Poco nuboso' }
  if (code === 3) return { e: '☁️', t: 'Nublado' }
  if (code <= 48) return { e: '🌫️', t: 'Niebla' }
  if (code <= 67) return { e: '🌧️', t: 'Lluvia' }
  if (code <= 77) return { e: '🌨️', t: 'Nieve' }
  if (code <= 82) return { e: '🌦️', t: 'Chubascos' }
  if (code <= 86) return { e: '🌨️', t: 'Nieve' }
  return { e: '⛈️', t: 'Tormenta' }
}

const EVENT_ICON = { flight:'✈️', hotel:'🏨', car:'🚗', park:'🎢', cruise:'🚢', restaurant:'🍽️', show:'🎭', transfer:'🚌', activity:'🎢', other:'📌' }

const pad = n => String(n).padStart(2, '0')
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function HoyPanel() {
  const { stages, events, filtrarEventos, family, isAdmin } = useApp()
  const [wx, setWx] = useState(null)
  const now = new Date()

  const visibleStages = stages.filter(s => isAdmin || !s.families || s.families.length === 0 || s.families.includes(family?.id))
  const active = visibleStages.find(s => {
    const f = new Date(s.from_date), t = new Date(s.to_date + 'T23:59:59')
    return now >= f && now <= t
  })

  const duringTrip = now >= TRIP_START && now <= TRIP_END
  const postTrip   = now > TRIP_END
  const tripDay    = Math.floor((now - TRIP_START) / DAY) + 1
  const daysToGo   = Math.ceil((TRIP_START - now) / DAY)

  // Destino objetivo + fecha objetivo para el clima
  const target = duringTrip
    ? (STAGE_COORDS[active?.id] || STAGE_COORDS.orlando)
    : STAGE_COORDS.orlando
  const targetDate = duringTrip ? now : TRIP_START
  const targetIso = isoLocal(targetDate)

  useEffect(() => {
    if (postTrip) return
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lng}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
    let cancel = false
    fetch(url).then(r => r.json()).then(d => {
      if (cancel) return
      const idx = d.daily?.time?.indexOf(targetIso)
      const i = idx >= 0 ? idx : 0
      setWx({
        nowTemp: d.current ? Math.round(d.current.temperature_2m) : null,
        code: d.daily?.weather_code?.[i] ?? d.current?.weather_code,
        max: d.daily?.temperature_2m_max ? Math.round(d.daily.temperature_2m_max[i]) : null,
        min: d.daily?.temperature_2m_min ? Math.round(d.daily.temperature_2m_min[i]) : null,
      })
    }).catch(() => {})
    return () => { cancel = true }
  }, [target.lat, target.lng, targetIso, postTrip])

  if (postTrip) return null

  const todayEvents = filtrarEventos(events)
    .filter(e => e.date === isoLocal(now))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const w = wx ? wmo(wx.code) : null

  return (
    <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Cabecera */}
      <div style={{
        background: duringTrip
          ? 'linear-gradient(135deg, #C8602A 0%, #E08A4E 100%)'
          : 'linear-gradient(135deg, #2563EB 0%, #4F86F7 100%)',
        color: '#fff', padding: '16px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>
            {duringTrip ? `Día ${tripDay} de ${TOTAL_DIAS}` : `Faltan ${daysToGo} día${daysToGo !== 1 ? 's' : ''}`}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: 2 }}>
            {duringTrip ? (active?.name || 'Hoy') : 'Próximo destino'}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: 2 }}>
            📍 {target.city}
          </div>
        </div>
        {w && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>{w.e}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 2 }}>
              {duringTrip && wx.nowTemp != null ? `${wx.nowTemp}°` : (wx.max != null ? `${wx.max}°` : '')}
            </div>
            {wx.max != null && wx.min != null && (
              <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{wx.max}° / {wx.min}°</div>
            )}
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '14px 18px' }}>
        {duringTrip ? (
          todayEvents.length > 0 ? (
            <>
              <div className="text-xs text-light" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Plan de hoy
              </div>
              {todayEvents.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: '1.1rem' }}>{EVENT_ICON[ev.type] || '📌'}</span>
                  <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{ev.title}</span>
                  {ev.time && <span className="text-xs text-muted" style={{ fontWeight: 700 }}>{ev.time}</span>}
                </div>
              ))}
            </>
          ) : (
            <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '4px 0' }}>
              🌴 Día libre · sin eventos programados hoy
            </div>
          )
        ) : (
          <div className="text-sm text-muted">
            {w ? `Clima previsto para la llegada: ${w.t.toLowerCase()}.` : '¡Preparando todo para el viaje!'} Tocá <strong>Viaje</strong> para ver el itinerario completo.
          </div>
        )}
      </div>
    </div>
  )
}
