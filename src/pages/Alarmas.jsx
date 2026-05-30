import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

function generateICS(alarm) {
  const start = new Date(alarm.trigger_at)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const action = alarm.action || {}

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USA2026//ES',
    'BEGIN:VEVENT',
    `UID:${alarm.id}@usa2026`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${alarm.title}`,
    action.label ? `DESCRIPTION:${action.label}${action.url ? ' - ' + action.url : ''}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([content], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${alarm.title.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  if (diff < 0) return 'Pasada'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `En ${days}d ${hours}h`
  if (hours > 0) return `En ${hours}h`
  const mins = Math.floor(diff / (1000 * 60))
  return `En ${mins} min`
}

export default function Alarmas() {
  const { filtrarPorPerfil } = useApp()
  const [alarms, setAlarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    supabase.from('alarms').select('*').order('trigger_at').then(({ data }) => {
      setAlarms(data || [])
      setLoading(false)
    })

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const now = new Date()
  const filtered = filtrarPorPerfil(alarms).filter(a => {
    if (filter === 'upcoming') return new Date(a.trigger_at) >= now && a.is_active
    if (filter === 'past') return new Date(a.trigger_at) < now
    return true
  })

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando alarmas...</span></div>

  return (
    <div className="page">
      <h2 className="page-title">🔔 Alarmas</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['upcoming', 'Próximas'], ['past', 'Pasadas'], ['all', 'Todas']].map(([id, label]) => (
          <button
            key={id}
            className={`btn btn-sm ${filter === id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(id)}
            style={{ flex: 1 }}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <p>Sin alarmas {filter === 'upcoming' ? 'próximas' : 'aquí'}.</p>
        </div>
      )}

      {filtered.map(alarm => {
        const isPast = new Date(alarm.trigger_at) < now
        const action = alarm.action || {}
        return (
          <div
            key={alarm.id}
            className="alarm-card"
            style={{ borderLeftColor: isPast ? 'var(--border)' : 'var(--accent)', opacity: isPast ? 0.7 : 1 }}
          >
            <div className="alarm-when">
              {new Date(alarm.trigger_at).toLocaleDateString('es-ES', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })} · {timeUntil(alarm.trigger_at)}
            </div>
            <div className="alarm-title">{alarm.title}</div>
            <div className="alarm-action" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {action.url && (
                <a href={action.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  {action.label || 'Ir'}
                </a>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => generateICS(alarm)}>
                📅 Agregar al calendario
              </button>
            </div>
          </div>
        )
      })}

      <div className="card" style={{ marginTop: 20, borderLeft: '4px solid var(--blue)' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>💡 Tip iPhone</div>
        <div className="text-sm text-muted">
          Para recibir push notifications en iPhone, la app debe estar <strong>instalada en home screen</strong> (Safari → Compartir → Agregar a inicio).
          Las alarmas de calendario (.ics) funcionan en todos los dispositivos.
        </div>
      </div>
    </div>
  )
}
