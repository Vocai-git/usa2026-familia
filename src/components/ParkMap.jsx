import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PARK_CENTERS, rideCoord } from '../data/parkMaps'

function waitColor(ride) {
  if (!ride.is_open || ride.wait_time == null) return '#9CA3AF'
  if (ride.wait_time <= 15) return '#16A34A'
  if (ride.wait_time <= 40) return '#F59E0B'
  return '#EF4444'
}

function rideIcon(ride) {
  const color = waitColor(ride)
  const label = (!ride.is_open || ride.wait_time == null) ? '✕' : ride.wait_time
  const html = `<div style="
    background:${color};color:#fff;font-weight:800;font-size:12px;
    width:30px;height:30px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.4);
  ">${label}</div>`
  return L.divIcon({ html, iconSize: [30, 30], iconAnchor: [15, 15], className: '' })
}

const meIcon = L.divIcon({
  html: `<div style="position:relative;width:20px;height:20px;">
    <div style="position:absolute;inset:0;background:#2563EB;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.3);"></div>
  </div>`,
  iconSize: [20, 20], iconAnchor: [10, 10], className: '',
})

function MeLocator({ onPos }) {
  const map = useMap()
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => onPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )
    return () => navigator.geolocation.clearWatch(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function ParkMap({ parkId, rides }) {
  const [me, setMe] = useState(null)
  const center = PARK_CENTERS[parkId]
  if (!center) return null

  const pins = (rides || [])
    .map(r => ({ ...r, coord: rideCoord(parkId, r.name) }))
    .filter(r => r.coord)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ height: '62dvh', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={[center.lat, center.lng]} zoom={center.zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <MeLocator onPos={setMe} />
          {pins.map(r => (
            <Marker key={r.id} position={[r.coord.lat, r.coord.lng]} icon={rideIcon(r)}>
              <Tooltip direction="top" offset={[0, -14]}>
                <strong>{r.name}</strong><br />
                {r.is_open && r.wait_time != null ? `${r.wait_time} min de espera` : 'Cerrada'}
              </Tooltip>
            </Marker>
          ))}
          {me && <Marker position={me} icon={meIcon}><Tooltip direction="top" offset={[0, -10]}>Estás acá</Tooltip></Marker>}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>🟢 ≤15 min</span><span>🟠 16–40</span><span>🔴 +40</span><span>⚪ cerrada</span><span>🔵 vos</span>
      </div>
      {center.aprox && (
        <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 6 }}>
          📍 Epic Universe es nuevo: las ubicaciones son aproximadas por mundo.
        </div>
      )}
      <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 4 }}>
        Tocá un pin para ver la atracción y su espera. El número es el tiempo de cola.
      </div>
    </div>
  )
}
