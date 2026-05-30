import { useApp } from '../context/AppContext'
import EventCard from '../components/EventCard'

function groupByDate(events) {
  const map = {}
  events.forEach(ev => {
    if (!map[ev.date]) map[ev.date] = []
    map[ev.date].push(ev)
  })
  return map
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const STAGE_COLORS = {
  orlando: '#E8622A', crucero: '#1A6FAB', miami: '#2EAA6E', ny: '#8B2FC9'
}

export default function Itinerario() {
  const { stages, events, filtrarPorPerfil, loading } = useApp()

  if (loading) {
    return <div className="loading"><div className="spinner" /><span>Cargando itinerario...</span></div>
  }

  const filteredEvents = filtrarPorPerfil(events)

  return (
    <div className="page">
      <h2 className="page-title">📅 Itinerario</h2>

      {stages.map(stage => {
        const stageEvents = filteredEvents.filter(e => e.stage_id === stage.id)
        if (stageEvents.length === 0) return null

        const byDate = groupByDate(stageEvents)
        const dates = Object.keys(byDate).sort()
        const color = STAGE_COLORS[stage.id] || 'var(--accent)'
        const from = new Date(stage.from_date + 'T12:00:00')
        const to = new Date(stage.to_date + 'T12:00:00')

        return (
          <div key={stage.id} style={{ marginBottom: 32 }}>
            <div
              className="stage-header"
              style={{ background: color, marginBottom: 16, borderRadius: 'var(--radius)' }}
            >
              <span style={{ fontSize: '1.5rem' }}>
                {stage.id === 'orlando' ? '🎡' : stage.id === 'crucero' ? '🚢' : stage.id === 'miami' ? '🌴' : '🗽'}
              </span>
              <div>
                <div>{stage.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>
                  {from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>

            {dates.map(date => (
              <div key={date}>
                <div className="day-header">{formatDate(date)}</div>
                {byDate[date].map(ev => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            ))}
          </div>
        )
      })}

      {filteredEvents.length === 0 && (
        <div className="empty-state">
          <div className="icon">📅</div>
          <p>No hay eventos para este perfil todavía.</p>
          <p className="text-sm" style={{ marginTop: 8 }}>Agregá eventos desde el panel admin.</p>
        </div>
      )}
    </div>
  )
}
