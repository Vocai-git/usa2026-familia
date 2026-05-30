import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const CATEGORY_EMOJI = {
  hotel: '🏨', airport: '✈️', park: '🎢', cruise_port: '🚢',
  restaurant: '🍽️', rental: '🚗', hospital: '🏥', other: '📌'
}

const CATEGORY_LABELS = {
  hotel: 'Hotel', airport: 'Aeropuerto', park: 'Parque',
  cruise_port: 'Puerto crucero', restaurant: 'Restaurante',
  rental: 'Rent-a-car', hospital: 'Hospital', other: 'Otro'
}

function createIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
    className: ''
  })
}

export default function Mapa() {
  const { filtrarPorPerfil } = useApp()
  const [pins, setPins] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('map_pins').select('*').then(({ data }) => {
      setPins(data || [])
      setLoading(false)
    })
  }, [])

  const filteredPins = filtrarPorPerfil(pins).filter(p => filter === 'all' || p.category === filter)
  const center = filteredPins.length > 0
    ? [filteredPins[0].lat, filteredPins[0].lng]
    : [28.5383, -81.3792] // Orlando

  const categories = [...new Set(pins.map(p => p.category))]

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando mapa...</span></div>

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <h2 className="page-title">🗺 Mapa del viaje</h2>

      {/* Filtros */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none' }}>
        <button
          className={`profile-pill${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
          style={{ flexShrink: 0 }}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`profile-pill${filter === cat ? ' active' : ''}`}
            onClick={() => setFilter(cat)}
            style={{ flexShrink: 0 }}
          >
            {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', height: 'calc(100dvh - 240px)' }}>
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredPins.map(pin => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createIcon(CATEGORY_EMOJI[pin.category] || '📌')}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: '0.95rem' }}>{pin.name}</strong>
                  {pin.address && <div style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>{pin.address}</div>}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', marginTop: 8,
                      background: '#C8602A', color: '#fff',
                      padding: '6px 12px', borderRadius: 8,
                      fontSize: '0.82rem', fontWeight: 700,
                      textAlign: 'center'
                    }}
                  >
                    🗺 Cómo llegar
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8, paddingBottom: 8 }}>
        💡 Descargá mapas offline de Orlando/Miami/NY en Google Maps antes de viajar
      </div>
    </div>
  )
}
