import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'

const TRIP_START = new Date('2026-06-10T00:00:00')
const TRIP_END = new Date('2026-07-19T00:00:00')

function getCountdown() {
  const now = new Date()
  const diff = TRIP_START - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

function getActiveStage(stages) {
  const now = new Date()
  return stages.find(s => {
    const from = new Date(s.from_date)
    const to = new Date(s.to_date)
    return now >= from && now <= to
  })
}

const STAGES_INFO = {
  orlando: { emoji: '🎡', desc: 'Parques Disney y Universal' },
  crucero: { emoji: '🚢', desc: 'Crucero por el Caribe' },
  miami: { emoji: '🌴', desc: 'Miami Beach' },
  ny: { emoji: '🗽', desc: 'La Gran Manzana' },
}

export default function Inicio() {
  const { stages, events, perfil, filtrarPorPerfil, people } = useApp()
  const countdown = getCountdown()
  const activeStage = getActiveStage(stages)
  const now = new Date()

  const proximosEventos = filtrarPorPerfil(
    events.filter(e => new Date(e.date) >= now)
  ).slice(0, 3)

  const totalDias = Math.round((TRIP_END - TRIP_START) / (1000 * 60 * 60 * 24))

  const persona = people.find(p => p.id === perfil)

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-title">
          {perfil === 'todos' ? '🇺🇸 USA 2026' : `🇺🇸 Hola, ${persona?.name || perfil}!`}
        </div>
        <div className="hero-sub">Viaje familiar · {totalDias} días</div>
        <div className="hero-dates">10 jun — 19 jul 2026</div>
      </div>

      {/* Countdown */}
      {countdown && (
        <>
          <div className="section-title">⏳ Faltan para despegar</div>
          <div className="countdown-grid">
            <div className="countdown-box">
              <div className="countdown-num">{countdown.days}</div>
              <div className="countdown-label">días</div>
            </div>
            <div className="countdown-box">
              <div className="countdown-num">{String(countdown.hours).padStart(2,'0')}</div>
              <div className="countdown-label">horas</div>
            </div>
            <div className="countdown-box">
              <div className="countdown-num">{String(countdown.minutes).padStart(2,'0')}</div>
              <div className="countdown-label">min</div>
            </div>
            <div className="countdown-box">
              <div className="countdown-num">{String(countdown.seconds).padStart(2,'0')}</div>
              <div className="countdown-label">seg</div>
            </div>
          </div>
        </>
      )}

      {/* Etapa activa */}
      {activeStage && (
        <>
          <div className="section-title">📍 Estás en</div>
          <div className="card" style={{ borderLeft: `4px solid ${activeStage.color}` }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              {STAGES_INFO[activeStage.id]?.emoji} {activeStage.name}
            </div>
            <div className="text-muted text-sm mt-8">{STAGES_INFO[activeStage.id]?.desc}</div>
          </div>
        </>
      )}

      {/* Etapas del viaje */}
      <div className="section-title">🗺 Etapas del viaje</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stages.map(stage => {
          const info = STAGES_INFO[stage.id] || {}
          const from = new Date(stage.from_date)
          const to = new Date(stage.to_date)
          const days = Math.round((to - from) / (1000 * 60 * 60 * 24))
          return (
            <div key={stage.id} className="card" style={{ borderTop: `3px solid ${stage.color}` }}>
              <div style={{ fontSize: '1.4rem' }}>{info.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 6 }}>{stage.name}</div>
              <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                {from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-muted text-sm">{days} días</div>
            </div>
          )
        })}
      </div>

      {/* Próximos eventos */}
      {proximosEventos.length > 0 && (
        <>
          <div className="section-title">📋 Próximos eventos</div>
          {proximosEventos.map(ev => (
            <div key={ev.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {ev.type === 'flight' ? '✈️' : ev.type === 'hotel' ? '🏨' : ev.type === 'park' ? '🎢' : '📌'}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ev.title}</div>
                  <div className="text-muted text-sm">
                    {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {ev.time && ` · ${ev.time}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link to="/itinerario" className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
            Ver itinerario completo →
          </Link>
        </>
      )}

      {/* Links rápidos */}
      <div className="section-title">⚡ Acceso rápido</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { to: '/parques', icon: '🎢', label: 'Tiempos de espera' },
          { to: '/documentos', icon: '📄', label: 'Documentos' },
          { to: '/mas/mapa', icon: '🗺', label: 'Mapa' },
          { to: '/mas/emergencias', icon: '🆘', label: 'Emergencias' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} className="card" style={{ textAlign: 'center', padding: '20px 12px', display: 'block' }}>
            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginTop: 8 }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Info viaje */}
      <div className="section-title">ℹ️ Datos del viaje</div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Salida', val: '10 jun 2026' },
            { label: 'Regreso', val: '19 jul 2026' },
            { label: 'Duración', val: '40 días' },
            { label: 'Viajeros', val: '12 personas' },
            { label: 'Crucero', val: '28 jun - 5 jul' },
            { label: 'Parque', val: 'Universal 14 días' },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="text-sm text-muted">{label}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
