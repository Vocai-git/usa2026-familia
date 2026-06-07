import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const CATEGORIES = {
  hotel:       { label: 'Hotel',          emoji: '🏨', color: '#3B82F6' },
  airport:     { label: 'Aeropuerto',     emoji: '✈️', color: '#8B5CF6' },
  park:        { label: 'Parque',         emoji: '🎢', color: '#22C55E' },
  cruise_port: { label: 'Puerto',         emoji: '🚢', color: '#0EA5E9' },
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
    if (pin) map.flyTo([pin.lat, pin.lng], 15, { duration: 0.8 })
  }, [pin, map])
  return null
}

export default function Mapa() {
  const { filtrarPorPerfil } = useApp()
  const [pins, setPins] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('map_pins').select('*').then(({ data }) => {
      setPins(data || [])
      setLoading(false)
    })
  }, [])

  const visible = filtrarPorPerfil(pins).filter(p => filter === 'all' || p.category === filter)
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
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
        </MapContainer>

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
