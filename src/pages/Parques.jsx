import { useState, useEffect, useRef, useCallback } from 'react'

const PARKS = [
  { id: 334, name: 'Epic Universe',         emoji: '🌌', company: 'Universal' },
  { id: 65,  name: 'Universal Studios FL',  emoji: '🎬', company: 'Universal' },
  { id: 64,  name: 'Islands of Adventure',  emoji: '🏝', company: 'Universal' },
]

// Volcano Bay usa Virtual Line de Universal, no tiene API de tiempos
const VOLCANO_BAY_URL = 'https://www.universalorlando.com/web/en/us/plan-your-visit/volcano-bay/virtual-line'

const APP_LINKS = {
  Universal: { web: 'https://www.universalorlando.com' },
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

// ─── Push subscription helpers ────────────────────────────────────────────────
async function getPushSubscription() {
  const sw = await navigator.serviceWorker.ready
  return sw.pushManager.getSubscription()
}

async function subscribeToPush() {
  try {
    const r = await fetch('/api/push/vapid-key')
    const { publicKey } = await r.json()
    const sw = await navigator.serviceWorker.ready
    const sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    })
    return sub
  } catch { return null }
}

async function syncAlarmsToServer(alarms) {
  const sub = await getPushSubscription()
  if (!sub) return
  fetch('/api/push/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, alarms })
  }).catch(() => {})
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
  const [pushEnabled, setPushEnabled] = useState(false)
  const intervalRef = useRef(null)

  // Detectar si ya hay suscripción push activa
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    getPushSubscription().then(sub => setPushEnabled(!!sub))
  }, [])

  const fetchWaitTimes = useCallback(async (park) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/park/${park.id}/times`)
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
    intervalRef.current = setInterval(() => fetchWaitTimes(selectedPark), 30 * 1000)
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

  const saveAlarm = async (ride) => {
    const key = `${selectedPark.id}_${ride.id}`
    const newAlarms = { ...alarms, [key]: { rideId: ride.id, rideName: ride.name, parkId: selectedPark.id, threshold: alarmThreshold, active: true, fired: null } }
    localStorage.setItem('park_alarms', JSON.stringify(newAlarms))
    setAlarms(newAlarms)
    setAddAlarm(null)

    // Activar push si no está activo
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        let sub = await getPushSubscription()
        if (!sub) {
          sub = await subscribeToPush()
          if (sub) {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub, alarms: newAlarms })
            })
            setPushEnabled(true)
          }
        } else {
          syncAlarmsToServer(newAlarms)
        }
      }
    }
  }

  const removeAlarm = (ride) => {
    const key = `${selectedPark.id}_${ride.id}`
    const newAlarms = { ...alarms }
    delete newAlarms[key]
    localStorage.setItem('park_alarms', JSON.stringify(newAlarms))
    setAlarms(newAlarms)
    syncAlarmsToServer(newAlarms)
  }

  const enablePush = async () => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const sub = await subscribeToPush()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, alarms })
      })
      setPushEnabled(true)
    }
  }

  let displayRides = [...rides]
  if (hideClosed) displayRides = displayRides.filter(r => r.is_open)
  if (sortBy === 'wait') displayRides.sort((a, b) => (a.wait_time ?? 999) - (b.wait_time ?? 999))
  else displayRides.sort((a, b) => a.name.localeCompare(b.name))

  const alarmCount = Object.values(alarms).filter(a => a.active).length

  return (
    <div className="page">
      <h2 className="page-title">🎢 Parques en vivo</h2>

      {/* Push notifications */}
      {!pushEnabled && Notification.permission !== 'denied' && (
        <div className="card" style={{ borderLeft: '4px solid var(--yellow)', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🔔 Notificaciones con la app cerrada</div>
          <div className="text-sm text-muted" style={{ marginBottom: 10 }}>Avisamos cuando baje la fila aunque tengas el teléfono guardado.</div>
          <button className="btn btn-primary btn-sm" onClick={enablePush}>Activar notificaciones</button>
        </div>
      )}
      {pushEnabled && (
        <div className="card" style={{ borderLeft: '4px solid var(--green)', marginBottom: 16, padding: '10px 16px' }}>
          <div className="text-sm" style={{ fontWeight: 700 }}>✅ Notificaciones activas — funcionan aunque cierres la app</div>
        </div>
      )}

      {/* Juegos en seguimiento */}
      {alarmCount > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent)', marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🔔 En seguimiento ({alarmCount})</div>
          {Object.entries(alarms).filter(([, a]) => a.active).map(([key, a]) => {
            const parkName = PARKS.find(p => p.id === a.parkId)?.name || ''
            const liveRide = rides.find(r => r.id === a.rideId)
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', flex: 1 }}>
                  <strong>{a.rideName}</strong>
                  <span className="text-muted"> · {parkName}</span>
                </span>
                {liveRide && (
                  <span className={`wait-time ${liveRide.is_open ? waitClass(liveRide.wait_time) : 'wait-closed'}`} style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                    {liveRide.is_open ? (liveRide.wait_time != null ? `${liveRide.wait_time}'` : '—') : 'Cerrada'}
                  </span>
                )}
                <span className="text-muted text-sm">aviso &lt;{a.threshold}min</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Volcano Bay — Virtual Line */}
      <a
        href={VOLCANO_BAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, textDecoration: 'none', borderLeft: '4px solid #0EA5E9' }}
      >
        <span style={{ fontSize: '1.6rem' }}>🌋</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Volcano Bay</div>
          <div className="text-sm text-muted">Usa Virtual Line — tocá para abrir el sistema de colas de Universal</div>
        </div>
        <span style={{ color: '#0EA5E9', fontWeight: 700 }}>→</span>
      </a>

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
          {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Cargando...'}
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
