import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const CATEGORIES = {
  hotel:       { label: 'Hotel',          emoji: '🏨', color: '#3B82F6' },
  airport:     { label: 'Aeropuerto',     emoji: '✈️', color: '#8B5CF6' },
  park:        { label: 'Parque',         emoji: '🌳', color: '#22C55E' },
  cruise_port: { label: 'Puerto',         emoji: '🚢', color: '#0EA5E9' },
  sight:       { label: 'Imperdible',     emoji: '⭐', color: '#F43F5E' },
  viewpoint:   { label: 'Mirador',        emoji: '🌆', color: '#8B5CF6' },
  museum:      { label: 'Museo',          emoji: '🏛️', color: '#0D9488' },
  shopping:    { label: 'Shopping',       emoji: '🛍️', color: '#EC4899' },
  restaurant:  { label: 'Restaurante',    emoji: '🍽️', color: '#F97316' },
  rental:      { label: 'Rent-a-car',     emoji: '🚗', color: '#F59E0B' },
  hospital:    { label: 'Hospital',       emoji: '🏥', color: '#EF4444' },
  other:       { label: 'Otro',           emoji: '📌', color: '#6B7280' },
}

function makeIcon(cat) {
  const { emoji, color } = CATEGORIES[cat] || CATEGORIES.other
  const html = `
    <div style="
      width:36px;height:36px;
      background:${color};
      border-radius:50% 50% 50% 4px;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      border:2px solid #fff;
      transform:rotate(-45deg);
    ">
      <span style="transform:rotate(45deg)">${emoji}</span>
    </div>`
  return L.divIcon({ html, iconSize: [36, 36], iconAnchor: [18, 34], className: '' })
}

function FlyTo({ pin }) {
  const map = useMap()
  useEffect(() => {
    if (pin && pin.lat != null && pin.lng != null) map.flyTo([pin.lat, pin.lng], 15, { duration: 0.8 })
  }, [pin, map])
  return null
}

// Marcador de persona (ubicación en vivo)
function personIcon(person, isMe) {
  const color = person.color || '#2563EB'
  const initial = (person.name || '?').trim().charAt(0).toUpperCase()
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        background:${color};color:#fff;font-weight:800;font-size:13px;
        min-width:30px;height:30px;padding:0 7px;border-radius:15px;
        display:flex;align-items:center;justify-content:center;gap:3px;
        border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);white-space:nowrap;
      ">${person.emoji || ''}<span>${person.name || initial}</span></div>
      ${isMe ? '<div style="font-size:9px;color:'+color+';font-weight:800;margin-top:1px;">(yo)</div>' : ''}
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${color};margin-top:-1px;"></div>
    </div>`
  return L.divIcon({ html, iconSize: [60, 44], iconAnchor: [30, 44], className: 'person-marker' })
}

// id de dispositivo persistente (para no duplicar a la misma persona)
function getDeviceId() {
  let id = localStorage.getItem('live_device_id')
  if (!id) { id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('live_device_id', id) }
  return id
}

function useLiveLocation(family) {
  const [people, setPeople] = useState([])
  const [sharing, setSharing] = useState(() => localStorage.getItem('live_sharing') === '1')
  const [error, setError] = useState(null)
  const watchRef = useRef(null)
  const lastSent = useRef(0)
  const deviceId = getDeviceId()

  // Traer ubicaciones de todos (activas: < 3 min)
  const fetchPeople = async () => {
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const { data } = await supabase.from('live_locations').select('*').gt('updated_at', cutoff)
    setPeople(data || [])
  }

  useEffect(() => {
    fetchPeople()
    const t = setInterval(fetchPeople, 12000)
    return () => clearInterval(t)
  }, [])

  const push = async (pos) => {
    const now = Date.now()
    if (now - lastSent.current < 8000) return // throttle 8s
    lastSent.current = now
    await supabase.from('live_locations').upsert({
      id: deviceId,
      name: localStorage.getItem('live_name') || family?.name || 'Alguien',
      family_id: family?.id || null,
      color: family?.color || '#2563EB',
      emoji: family?.emoji || '📍',
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    fetchPeople()
  }

  const start = () => {
    if (!navigator.geolocation) { setError('Tu dispositivo no soporta geolocalización'); return }
    let name = localStorage.getItem('live_name')
    if (!name) {
      name = (window.prompt('¿Con qué nombre te ven los demás?', family?.name || '') || '').trim()
      if (name) localStorage.setItem('live_name', name)
    }
    setError(null)
    watchRef.current = navigator.geolocation.watchPosition(
      push,
      (e) => setError(e.code === 1 ? 'Activá los permisos de ubicación' : 'No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )
    localStorage.setItem('live_sharing', '1')
    setSharing(true)
  }

  const stop = async () => {
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
    localStorage.setItem('live_sharing', '')
    setSharing(false)
    await supabase.from('live_locations').delete().eq('id', deviceId)
    fetchPeople()
  }

  // Reanudar si quedó activo de antes
  useEffect(() => {
    if (sharing && watchRef.current == null) start()
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { people, sharing, error, start, stop, deviceId }
}

export default function Mapa() {
  const { filtrarPorPerfil, family } = useApp()
  const [pins, setPins] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const { people, sharing, error: geoError, start, stop, deviceId } = useLiveLocation(family)

  useEffect(() => {
    supabase.from('map_pins').select('*').then(({ data }) => {
      setPins(data || [])
      setLoading(false)
    })
  }, [])

  const visible = filtrarPorPerfil(pins)
    .filter(p => p.lat != null && p.lng != null)
    .filter(p => filter === 'all' || p.category === filter)
  const usedCats = [...new Set(pins.map(p => p.category))].filter(c => CATEGORIES[c])
  const center = [28.4742, -81.4697] // Universal Orlando como centro

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando mapa...</span></div>

  const cat = selected ? (CATEGORIES[selected.category] || CATEGORIES.other) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 64px)', overflow: 'hidden' }}>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 14px 6px',
        overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
      }}>
        <button
          onClick={() => setFilter('all')}
          className={`profile-pill${filter === 'all' ? ' active' : ''}`}
          style={{ flexShrink: 0, fontSize: '0.78rem' }}
        >
          Todos
        </button>
        {usedCats.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`profile-pill${filter === c ? ' active' : ''}`}
            style={{ flexShrink: 0, fontSize: '0.78rem' }}
          >
            {CATEGORIES[c].emoji} {CATEGORIES[c].label}
          </button>
        ))}
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <FlyTo pin={selected} />
          {visible.map(pin => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={makeIcon(pin.category)}
              eventHandlers={{ click: () => setSelected(pin) }}
            />
          ))}
          {/* Personas en vivo */}
          {people.filter(p => p.lat != null && p.lng != null).map(p => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={personIcon(p, p.id === deviceId)}
              zIndexOffset={1000}
            />
          ))}
        </MapContainer>

        {/* Botón ubicación en vivo */}
        <div style={{ position: 'absolute', bottom: 16, left: 12, zIndex: 1000 }}>
          <button
            onClick={sharing ? stop : start}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: sharing ? '#16A34A' : '#fff',
              color: sharing ? '#fff' : '#111',
              border: 'none', borderRadius: 24, padding: '10px 16px',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}
          >
            {sharing ? '🟢 Compartiendo ubicación · Detener' : '📍 Activar ubicación'}
          </button>
          {geoError && (
            <div style={{ marginTop: 6, background: '#FEF2F2', color: '#B91C1C', fontSize: '0.7rem', padding: '5px 10px', borderRadius: 10, maxWidth: 230 }}>
              ⚠️ {geoError}
            </div>
          )}
          {sharing && people.length > 0 && (
            <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.92)', fontSize: '0.7rem', padding: '4px 10px', borderRadius: 10, fontWeight: 600 }}>
              👥 {people.length} compartiendo ahora
            </div>
          )}
        </div>

        {/* Conteo */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', borderRadius: 20,
          padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {visible.length} lugar{visible.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Bottom sheet: pin seleccionado */}
      {selected && (
        <div
          style={{
            position: 'absolute', bottom: 64, left: 0, right: 0, zIndex: 1000,
            padding: '0 12px 8px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '16px 18px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: cat.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', flexShrink: 0,
              }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111', lineHeight: 1.2 }}>
                  {selected.name}
                </div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 600, marginTop: 3,
                  color: cat.color, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {cat.label}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: '#f4f4f5', border: 'none', borderRadius: 50, width: 30, height: 30, cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {selected.address && (
              <div style={{
                fontSize: '0.8rem', color: '#666', marginBottom: 14,
                paddingLeft: 56, lineHeight: 1.4,
              }}>
                📍 {selected.address}
              </div>
            )}

            {/* Botón navegar */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, width: '100%', padding: '13px 16px',
                background: '#1A73E8', color: '#fff',
                borderRadius: 14, fontWeight: 700, fontSize: '0.95rem',
                textDecoration: 'none', boxSizing: 'border-box',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
              </svg>
              Navegar en Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
