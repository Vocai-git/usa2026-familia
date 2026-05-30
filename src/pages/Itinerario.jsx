import { useApp } from '../context/AppContext'

const TYPE_ICON = {
  flight: '✈️', hotel: '🏨', car: '🚗', park: '🎢', cruise: '🚢',
  restaurant: '🍽️', show: '🎭', transfer: '🚌', other: '📌'
}
const STAGE_COLORS = { orlando: '#2563EB', crucero: '#7C3AED', miami: '#16A34A', ny: '#DC2626' }
const STAGE_EMOJI  = { orlando: '🎡', crucero: '🚢', miami: '🌴', ny: '🗽' }

import { useState } from 'react'

function EventCard({ event }) {
  const [open, setOpen] = useState(false)
  const d = event.details || {}
  const loc = event.location || {}
  const gmaps = loc.lat
    ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    : loc.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}` : null

  return (
    <div className="event-card" onClick={() => setOpen(o => !o)}>
      <div className="event-icon-wrap">{TYPE_ICON[event.type] || '📌'}</div>
      <div className="event-body">
        <div className="event-title">{event.title}</div>
        <div className="event-meta">
          {event.time && <span>⏰ {event.time}</span>}
          {loc.name && <span> · 📍 {loc.name}</span>}
        </div>
        {open && (
          <div style={{ marginTop: 10 }}>
            <div className="divider" />
            {d.airline && <div className="event-detail">✈️ {d.airline} {d.flightNumber}</div>}
            {d.pnr && <div className="event-detail">🔑 PNR: <strong>{d.pnr}</strong></div>}
            {d.confirmation && <div className="event-detail">📋 Conf: <strong>{d.confirmation}</strong></div>}
            {d.ship && <div className="event-detail">🚢 {d.ship}</div>}
            {d.checkIn && <div className="event-detail">🏁 Check-in: {d.checkIn}</div>}
            {d.checkOut && <div className="event-detail">🏁 Check-out: {d.checkOut}</div>}
            {d.notes && <div className="event-detail" style={{ fontStyle: 'italic', marginTop: 4 }}>{d.notes}</div>}
            {loc.address && <div className="event-detail">🗺 {loc.address}</div>}
            {gmaps && (
              <a
                href={gmaps}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10, display: 'inline-flex' }}
              >
                🗺 Cómo llegar
              </a>
            )}
          </div>
        )}
      </div>
      <span className="event-expand">{open ? '▲' : '▼'}</span>
    </div>
  )
}

function fmtDate(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

export default function Itinerario() {
  const { stages, events, filtrarEventos, loading } = useApp()
  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando...</span></div>

  const filtered = filtrarEventos(events)

  return (
    <div className="page">
      <h2 className="page-title">Itinerario</h2>
      {stages.map(stage => {
        const evs = filtered.filter(e => e.stage_id === stage.id)
        if (!evs.length) return null
        const color = STAGE_COLORS[stage.id] || 'var(--accent)'
        const byDate = {}
        evs.forEach(e => { if (!byDate[e.date]) byDate[e.date] = []; byDate[e.date].push(e) })
        const from = new Date(stage.from_date + 'T12:00:00')
        const to   = new Date(stage.to_date   + 'T12:00:00')
        return (
          <div key={stage.id} style={{ marginBottom: 32 }}>
            <div className="stage-header" style={{ background: color }}>
              <div className="stage-header-title">{STAGE_EMOJI[stage.id]} {stage.name}</div>
              <div className="stage-header-sub">
                {from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            {Object.keys(byDate).sort().map(date => (
              <div key={date}>
                <div className="day-header">{fmtDate(date)}</div>
                {byDate[date].map(ev => <EventCard key={ev.id} event={ev} />)}
              </div>
            ))}
          </div>
        )
      })}
      {!filtered.length && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-title">Sin eventos</div>
          <div className="empty-text">El admin todavía no cargó eventos para tu familia.</div>
        </div>
      )}
    </div>
  )
}
