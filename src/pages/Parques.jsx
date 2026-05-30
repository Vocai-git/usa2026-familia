import { useState, useEffect, useRef, useCallback } from 'react'

const PARKS = [
  { id: 334, name: 'Epic Universe',           emoji: '🌌', company: 'Universal' },
  { id: 65,  name: 'Universal Studios FL',   emoji: '🎬', company: 'Universal' },
  { id: 64,  name: 'Islands of Adventure',   emoji: '🏝', company: 'Universal' },
  { id: 6,   name: 'Magic Kingdom',          emoji: '🏰', company: 'Disney' },
  { id: 5,   name: 'EPCOT',                  emoji: '🌍', company: 'Disney' },
  { id: 7,   name: 'Hollywood Studios',      emoji: '🎬', company: 'Disney' },
  { id: 8,   name: 'Animal Kingdom',         emoji: '🦁', company: 'Disney' },
]

const DEEP_LINKS = {
  Universal: 'https://www.universalorlando.com/web/en/us/plan-your-visit/park-maps',
  Disney: 'https://disneyworld.disney.go.com/entertainment/',
}

const APP_LINKS = {
  Universal: { ios: 'universalorlando://', android: 'universalorlando://', web: 'https://www.universalorlando.com' },
  Disney: { ios: 'wdw://', android: 'wdw://', web: 'https://disneyworld.disney.go.com' },
}

function waitClass(mins) {
  if (mins === null || mins === undefined) return 'wait-closed'
  if (mins <= 20) return 'wait-green'
  if (mins <= 45) return 'wait-yellow'
  return 'wait-red'
}

function Summary({ rides }) {
  const open = rides.filter(r => r.is_open && r.wait_time !== null)
  const green = open.filter(r => r.wait_time <= 20).length
  const yellow = open.filter(r => r.wait_time > 20 && r.wait_time <= 45).length
  const red = open.filter(r => r.wait_time > 45).length
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <span className="badge badge-green">✅ {green} &lt;20min</span>
      <span className="badge badge-yellow">⚡ {yellow} 20-45min</span>
      <span className="badge badge-red">🔴 {red} +45min</span>
      <span className="badge" style={{ background: 'var(--surface2)' }}>⛔ {rides.length - open.length} cerradas</span>
    </div>
  )
}

export default function Parques() {
  const [selectedPark, setSelectedPark] = useState(PARKS[0])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [sortBy, setSortBy] = useState('wait')
  const [hideClosed, setHideClosed] = useState(true)
  const [alarms, setAlarms] = useState(() => JSON.parse(localStorage.getItem('park_alarms') || '{}'))
  const [addAlarm, setAddAlarm] = useState(null)
  const [alarmThreshold, setAlarmThreshold] = useState(20)
  const intervalRef = useRef(null)

  const fetchWaitTimes = useCallback(async (park) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://queue-times.com/parks/${park.id}/queue_times.json`)
      if (!res.ok) throw new Error('API no disponible')
      const data = await res.json()
      const allRides = []
      ;(data.lands || []).forEach(land => {
        ;(land.rides || []).forEach(ride => allRides.push(ride))
      })
      setRides(allRides)
      setLastUpdate(new Date())
    } catch (e) {
      setError('No se pudo cargar. Mostrando datos cacheados si hay.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWaitTimes(selectedPark)
    intervalRef.current = setInterval(() => fetchWaitTimes(selectedPark), 5 * 60 * 1000)
    return () => clearInterval(intervalRef.current)
  }, [selectedPark, fetchWaitTimes])

  // Check alarms on every update
  useEffect(() => {
    const savedAlarms = JSON.parse(localStorage.getItem('park_alarms') || '{}')
    rides.forEach(ride => {
      const alarm = savedAlarms[`${selectedPark.id}_${ride.id}`]
      if (!alarm || !alarm.active) return
      if (ride.is_open && ride.wait_time !== null && ride.wait_time <= alarm.threshold) {
        if (Notification.permission === 'granted') {
          new Notification(`🎢 ${ride.name}`, {
            body: `¡Solo ${ride.wait_time} minutos de espera!`,
            icon: '/icons/icon-192.png'
          })
        }
        // Rearm: deactivate, reactivate when it goes above threshold + 5
        savedAlarms[`${selectedPark.id}_${ride.id}`].fired = ride.wait_time
      } else if (alarm.fired && ride.wait_time > alarm.threshold + 5) {
        savedAlarms[`${selectedPark.id}_${ride.id}`].fired = null
      }
    })
    localStorage.setItem('park_alarms', JSON.stringify(savedAlarms))
    setAlarms(savedAlarms)
  }, [rides, selectedPark])

  const saveAlarm = (ride) => {
    const key = `${selectedPark.id}_${ride.id}`
    const newAlarms = { ...alarms, [key]: { rideId: ride.id, rideName: ride.name, parkId: selectedPark.id, threshold: alarmThreshold, active: true, fired: null } }
    localStorage.setItem('park_alarms', JSON.stringify(newAlarms))
    setAlarms(newAlarms)
    setAddAlarm(null)
    if (Notification.permission === 'default') Notification.requestPermission()
  }

  const removeAlarm = (ride) => {
    const key = `${selectedPark.id}_${ride.id}`
    const newAlarms = { ...alarms }
    delete newAlarms[key]
    localStorage.setItem('park_alarms', JSON.stringify(newAlarms))
    setAlarms(newAlarms)
  }

  const requestNotifications = () => Notification.requestPermission()

  let displayRides = [...rides]
  if (hideClosed) displayRides = displayRides.filter(r => r.is_open)
  if (sortBy === 'wait') displayRides.sort((a, b) => (a.wait_time ?? 999) - (b.wait_time ?? 999))
  else displayRides.sort((a, b) => a.name.localeCompare(b.name))

  const alarmCount = Object.values(alarms).filter(a => a.active).length

  return (
    <div className="page">
      <h2 className="page-title">🎢 Parques en vivo</h2>

      {/* Notificaciones */}
      {Notification.permission === 'default' && (
        <div className="card" style={{ borderLeft: '4px solid var(--yellow)', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>⚡ Activá las notificaciones</div>
          <div className="text-sm text-muted" style={{ marginBottom: 10 }}>Para recibir alertas cuando baje el tiempo de espera.</div>
          <button className="btn btn-primary btn-sm" onClick={requestNotifications}>Activar</button>
        </div>
      )}

      {/* Selector de parque */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        {PARKS.map(park => (
          <button
            key={park.id}
            onClick={() => setSelectedPark(park)}
            className={`profile-pill${selectedPark.id === park.id ? ' active' : ''}`}
            style={{ flexShrink: 0 }}
          >
            {park.emoji} {park.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${sortBy === 'wait' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSortBy('wait')}
        >⏱ Por espera</button>
        <button
          className={`btn btn-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSortBy('name')}
        >🔤 Por nombre</button>
        <button
          className={`btn btn-sm ${hideClosed ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setHideClosed(h => !h)}
        >{hideClosed ? '🙈 Ocultando cerradas' : '👁 Mostrando cerradas'}</button>
        {alarmCount > 0 && (
          <span className="badge badge-accent">🔔 {alarmCount} alarmas activas</span>
        )}
      </div>

      {/* Update time + deep link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="text-sm text-muted">
          {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
        </span>
        <a
          href={APP_LINKS[selectedPark.company]?.web}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-secondary"
        >
          Abrir app oficial 📱
        </a>
      </div>

      {loading && rides.length === 0 && (
        <div className="loading"><div className="spinner" /><span>Cargando tiempos...</span></div>
      )}

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--red)', marginBottom: 12 }}>
          <div className="text-sm">⚠️ {error}</div>
          <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => fetchWaitTimes(selectedPark)}>
            Reintentar
          </button>
        </div>
      )}

      {rides.length > 0 && <Summary rides={rides} />}

      <div className="card" style={{ padding: '0 16px' }}>
        {displayRides.map(ride => {
          const alarmKey = `${selectedPark.id}_${ride.id}`
          const hasAlarm = !!alarms[alarmKey]
          return (
            <div key={ride.id} className="wait-bar">
              <div style={{ flex: 1 }}>
                <div className="wait-name">{ride.name}</div>
                {hasAlarm && (
                  <div className="text-sm" style={{ color: 'var(--accent)' }}>
                    🔔 Aviso a &lt;{alarms[alarmKey].threshold} min
                  </div>
                )}
              </div>
              <div className={`wait-time ${ride.is_open ? waitClass(ride.wait_time) : 'wait-closed'}`}>
                {ride.is_open
                  ? (ride.wait_time !== null ? `${ride.wait_time}'` : '—')
                  : 'Cerrada'}
              </div>
              <button
                style={{ marginLeft: 8, fontSize: '1.2rem', lineHeight: 1 }}
                onClick={() => hasAlarm ? removeAlarm(ride) : setAddAlarm(ride)}
                title={hasAlarm ? 'Quitar alarma' : 'Agregar alarma'}
              >
                {hasAlarm ? '🔔' : '🔕'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
        Powered by <a href="https://queue-times.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Queue-Times.com</a>
      </div>

      {/* Modal alarma */}
      {addAlarm && (
        <div className="modal-overlay" onClick={() => setAddAlarm(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">🔔 Alarma para {addAlarm.name}</div>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Te avisamos cuando el tiempo baje de:
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[10, 20, 30, 45].map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${alarmThreshold === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setAlarmThreshold(t)}
                >
                  {t} min
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={() => saveAlarm(addAlarm)}>
              Activar alarma
            </button>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setAddAlarm(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
