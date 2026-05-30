import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TRIP_START = new Date('2026-06-10T00:00:00')
const TRIP_END   = new Date('2026-07-19T00:00:00')

function useCountdown() {
  const [cd, setCd] = useState(() => calc())
  useEffect(() => {
    const t = setInterval(() => setCd(calc()), 1000)
    return () => clearInterval(t)
  }, [])
  return cd
}
function calc() {
  const diff = TRIP_START - new Date()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

const STAGE_COLORS = {
  orlando: '#2563EB', crucero: '#7C3AED', miami: '#16A34A', ny: '#DC2626'
}
const STAGE_EMOJI = { orlando: '🎡', crucero: '🚢', miami: '🌴', ny: '🗽' }

const EVENT_ICON = {
  flight: '✈️', hotel: '🏨', car: '🚗', park: '🎢',
  cruise: '🚢', restaurant: '🍽️', show: '🎭', transfer: '🚌', other: '📌'
}

export default function Inicio() {
  const { stages, events, filtrarEventos, family } = useApp()
  const cd = useCountdown()
  const now = new Date()
  const upcoming = filtrarEventos(events).filter(e => new Date(e.date) >= now).slice(0, 3)
  const activeStage = stages.find(s => {
    const from = new Date(s.from_date), to = new Date(s.to_date)
    return now >= from && now <= to
  })
  const totalDias = Math.round((TRIP_END - TRIP_START) / 86400000)

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-card" style={{ marginBottom: 20 }}>
        <div className="hero-eyebrow">Viaje familiar · {totalDias} días</div>
        <div className="hero-title">USA 2026 🇺🇸</div>
        <div className="hero-sub">10 jun — 19 jul · {family?.name}</div>
        {activeStage && (
          <div className="hero-badge">
            {STAGE_EMOJI[activeStage.id]} {activeStage.name}
          </div>
        )}
      </div>

      {/* Countdown */}
      {cd && (
        <>
          <div className="section-label">⏳ Faltan para despegar</div>
          <div className="countdown-row" style={{ marginBottom: 4 }}>
            {[['d', cd.d, 'días'], ['h', cd.h, 'horas'], ['m', cd.m, 'min'], ['s', cd.s, 'seg']].map(([, val, lbl]) => (
              <div key={lbl} className="countdown-unit">
                <div className="countdown-num">{String(val).padStart(2, '0')}</div>
                <div className="countdown-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Etapas */}
      <div className="section-label">🗺 Etapas del viaje</div>
      <div className="stage-list">
        {stages.map(s => {
          const from = new Date(s.from_date + 'T12:00:00')
          const to   = new Date(s.to_date   + 'T12:00:00')
          const days = Math.round((to - from) / 86400000)
          const color = STAGE_COLORS[s.id] || 'var(--accent)'
          const isActive = activeStage?.id === s.id
          return (
            <div key={s.id} className="stage-item" style={isActive ? { borderColor: color, boxShadow: `0 0 0 2px ${color}22` } : {}}>
              <div className="stage-dot" style={{ background: color }} />
              <div className="stage-name">{STAGE_EMOJI[s.id]} {s.name}</div>
              <div>
                <div className="stage-dates">
                  {from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="stage-days">{days}d</div>
            </div>
          )
        })}
      </div>

      {/* Próximos eventos */}
      {upcoming.length > 0 && (
        <>
          <div className="section-label">📋 Próximos eventos</div>
          {upcoming.map(ev => (
            <div key={ev.id} className="event-card" style={{ marginBottom: 6 }}>
              <div className="event-icon-wrap">{EVENT_ICON[ev.type] || '📌'}</div>
              <div className="event-body">
                <div className="event-title">{ev.title}</div>
                <div className="event-meta">
                  {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {ev.time && ` · ${ev.time}`}
                </div>
              </div>
            </div>
          ))}
          <Link to="/itinerario" className="btn btn-secondary btn-block" style={{ marginTop: 4 }}>
            Ver itinerario completo →
          </Link>
        </>
      )}

      {/* Acceso rápido */}
      <div className="section-label">⚡ Acceso rápido</div>
      <div className="quick-grid">
        {[
          { to: '/parques',   icon: '🎢', label: 'Parques en vivo' },
          { to: '/documentos',icon: '📄', label: 'Documentos' },
          { to: '/mas/mapa',  icon: '🗺', label: 'Mapa' },
          { to: '/mas/emergencias', icon: '🆘', label: 'Emergencias' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} className="quick-item">
            <div className="quick-icon">{icon}</div>
            <div className="quick-label">{label}</div>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="section-label">ℹ️ Datos del viaje</div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['Salida', '10 jun 2026'],
            ['Regreso', '19 jul 2026'],
            ['Duración', '40 días'],
            ['Personas', '12 viajeros'],
            ['Crucero', '28 jun – 5 jul'],
            ['Parques', 'Universal 14d'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-light">{k}</div>
              <div className="fw-700 text-sm" style={{ marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
