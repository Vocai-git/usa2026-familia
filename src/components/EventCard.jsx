import { useState } from 'react'
import { useApp } from '../context/AppContext'

const TYPE_ICON = {
  flight: '✈️', hotel: '🏨', car: '🚗', park: '🎢', cruise: '🚢',
  restaurant: '🍽️', show: '🎭', transfer: '🚌', other: '📌'
}

const TYPE_LABEL = {
  flight: 'Vuelo', hotel: 'Hotel', car: 'Auto', park: 'Parque',
  cruise: 'Crucero', restaurant: 'Restaurante', show: 'Show',
  transfer: 'Traslado', other: 'Evento'
}

export default function EventCard({ event }) {
  const [expanded, setExpanded] = useState(false)
  const { people } = useApp()

  const icon = TYPE_ICON[event.type] || '📌'
  const details = event.details || {}
  const location = event.location || {}

  const getPersonName = (id) => {
    const p = people.find(p => p.id === id)
    return p ? p.name : id
  }

  const participantes = (event.people || []).filter(p => !['todos', 'nucleo', 'crucero', 'hermanos', 'papa_andrea'].includes(p))

  const gmapsUrl = location.lat && location.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    : location.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
      : null

  return (
    <div className="event-card" onClick={() => setExpanded(e => !e)}>
      <span className="event-icon">{icon}</span>
      <div className="event-body">
        <div className="event-title">{event.title}</div>
        {event.time && (
          <div className="event-time">⏰ {event.time}</div>
        )}
        {location.name && (
          <div className="event-detail">📍 {location.name}</div>
        )}

        {expanded && (
          <div style={{ marginTop: 10 }}>
            {details.airline && <div className="event-detail">✈️ {details.airline} · {details.flightNumber}</div>}
            {details.pnr && <div className="event-detail">🔑 PNR: <strong>{details.pnr}</strong></div>}
            {details.confirmation && <div className="event-detail">📋 Confirmación: <strong>{details.confirmation}</strong></div>}
            {details.ship && <div className="event-detail">🚢 Barco: {details.ship}</div>}
            {details.checkIn && <div className="event-detail">🏁 Check-in: {details.checkIn}</div>}
            {details.checkOut && <div className="event-detail">🏁 Check-out: {details.checkOut}</div>}
            {details.notes && <div className="event-detail" style={{ marginTop: 6, fontStyle: 'italic' }}>{details.notes}</div>}
            {location.address && <div className="event-detail">🗺 {location.address}</div>}

            {gmapsUrl && (
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="btn btn-sm btn-secondary"
                style={{ marginTop: 10, display: 'inline-flex' }}
              >
                🗺 Cómo llegar
              </a>
            )}

            {participantes.length > 0 && (
              <div className="event-tags" style={{ marginTop: 10 }}>
                {participantes.map(p => (
                  <span key={p} className="tag">{getPersonName(p)}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
        {expanded ? '▲' : '▼'}
      </span>
    </div>
  )
}
