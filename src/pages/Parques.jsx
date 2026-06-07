import { useState, useEffect, useRef, useCallback } from 'react'

const PARKS = [
  { id: 334, name: 'Epic Universe',         emoji: '🌌' },
  { id: 65,  name: 'Universal Studios',     emoji: '🎬' },
  { id: 64,  name: 'Islands of Adventure',  emoji: '🏝' },
  { id: 'volcano', name: 'Volcano Bay',     emoji: '🌋' },
]

function waitColor(mins) {
  if (mins <= 15) return '#22c55e'
  if (mins <= 30) return '#f59e0b'
  if (mins <= 60) return '#f97316'
  return '#ef4444'
}

function LandSection({ land, isOpen, onToggle, alarms, onAlarm }) {
  const openRides = (land.rides || []).filter(r => r.is_open && r.wait_time !== null)
  if (openRides.length === 0) return null

  const minWait = Math.min(...openRides.map(r => r.wait_time))
  const sorted = [...openRides].sort((a, b) => a.wait_time - b.wait_time)

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: isOpen ? '12px 12px 0 0' : 12,
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {land.name}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {openRides.length} abiertas · desde {minWait} min
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', flexShrink: 0, color: 'var(--text-muted)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div style={{
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
        }}>
          {sorted.map((ride, i) => {
            const hasAlarm = !!alarms[ride.id]
            return (
              <div
                key={ride.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  background: 'var(--surface)',
                  gap: 10,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ flex: 1, fontSize: '0.84rem', lineHeight: 1.3, minWidth: 0 }}>{ride.name}</div>
                <div style={{
                  background: waitColor(ride.wait_time),
                  color: '#fff',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {ride.wait_time} min
                </div>
                <button
                  onClick={() => onAlarm(ride)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 2px', flexShrink: 0 }}
                >
                  {hasAlarm ? '🔔' : '🔕'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Parques() {
  const [selectedPark, setSelectedPark] = useState(PARKS[0])
  const [showPicker, setShowPicker] = useState(false)
  const [lands, setLands] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [openLand, setOpenLand] = useState(null)
  const [alarms, setAlarms] = useState(() => JSON.parse(localStorage.getItem('park_alarms') || '{}'))
  const [addAlarm, setAddAlarm] = useState(null)
  const [alarmThreshold, setAlarmThreshold] = useState(20)
  const intervalRef = useRef(null)

  const fetchWaitTimes = useCallback(async (park) => {
    if (park.id === 'volcano') return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/park/${park.id}/times`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLands(data.lands || [])
      setLastUpdate(new Date())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLands([])
    setOpenLand(null)
    setError(false)
    clearInterval(intervalRef.current)
    if (selectedPark.id !== 'volcano') {
      fetchWaitTimes(selectedPark)
      intervalRef.current = setInterval(() => fetchWaitTimes(selectedPark), 30 * 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [selectedPark, fetchWaitTimes])

  // Auto-open first land with rides when data loads
  useEffect(() => {
    if (!lands.length || openLand) return
    const first = lands.find(l => (l.rides || []).some(r => r.is_open && r.wait_time !== null))
    if (first) setOpenLand(first.name)
  }, [lands])

  // Check local alarms on data update
  useEffect(() => {
    if (!lands.length) return
    const current = JSON.parse(localStorage.getItem('park_alarms') || '{}')
    const allRides = lands.flatMap(l => l.rides || [])
    let changed = false
    allRides.forEach(ride => {
      const alarm = current[ride.id]
      if (!alarm?.active) return
      if (ride.is_open && ride.wait_time !== null && ride.wait_time <= alarm.threshold && !alarm.fired) {
        if (Notification.permission === 'granted') {
          new Notification(`🎢 ${ride.name}`, { body: `¡Solo ${ride.wait_time} min!`, icon: '/icons/icon-192.png' })
        }
        current[ride.id] = { ...alarm, fired: true }
        changed = true
      } else if (alarm.fired && ride.wait_time !== null && ride.wait_time > alarm.threshold + 5) {
        current[ride.id] = { ...alarm, fired: false }
        changed = true
      }
    })
    if (changed) {
      localStorage.setItem('park_alarms', JSON.stringify(current))
      setAlarms(current)
    }
  }, [lands])

  const saveAlarm = (ride) => {
    const newAlarms = {
      ...alarms,
      [ride.id]: { rideId: ride.id, rideName: ride.name, threshold: alarmThreshold, active: true, fired: false }
    }
    localStorage.setItem('park_alarms', JSON.stringify(newAlarms))
    setAlarms(newAlarms)
    setAddAlarm(null)
    if (Notification.permission === 'default') Notification.requestPermission()
  }

  const removeAlarm = (ride) => {
    const updated = { ...alarms }
    delete updated[ride.id]
    localStorage.setItem('park_alarms', JSON.stringify(updated))
    setAlarms(updated)
  }

  const allOpenRides = lands.flatMap(l => (l.rides || []).filter(r => r.is_open && r.wait_time !== null))
  const s15 = allOpenRides.filter(r => r.wait_time <= 15).length
  const s30 = allOpenRides.filter(r => r.wait_time > 15 && r.wait_time <= 30).length
  const sMore = allOpenRides.filter(r => r.wait_time > 30).length
  const alarmCount = Object.values(alarms).filter(a => a.active).length

  return (
    <div className="page" style={{ maxWidth: '100%', overflowX: 'hidden' }}>

      {/* ── Selector de parque ── */}
      <button
        onClick={() => setShowPicker(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--surface)',
          border: '2px solid var(--accent)',
          borderRadius: 14,
          cursor: 'pointer',
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>{selectedPark.emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedPark.name}</div>
            {lastUpdate && selectedPark.id !== 'volcano' && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>Cambiar ▾</span>
      </button>

      {/* ── Volcano Bay ── */}
      {selectedPark.id === 'volcano' && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌋</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Volcano Bay</div>
          <div className="text-muted text-sm" style={{ marginBottom: 20 }}>
            Usa el sistema Virtual Line de Universal. Las colas se manejan desde la app oficial.
          </div>
          <a
            href="https://www.universalorlando.com/web/en/us/plan-your-visit/volcano-bay/virtual-line"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block"
          >
            Abrir Virtual Line →
          </a>
        </div>
      )}

      {/* ── Vista parque real ── */}
      {selectedPark.id !== 'volcano' && (
        <>
          {/* Resumen */}
          {allOpenRides.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {s15 > 0 && <span className="badge badge-green">🟢 {s15} ≤15 min</span>}
              {s30 > 0 && <span className="badge badge-yellow">🟡 {s30} 15-30 min</span>}
              {sMore > 0 && <span className="badge badge-red">🔴 {sMore} +30 min</span>}
              {alarmCount > 0 && <span className="badge badge-accent">🔔 {alarmCount} alarmas</span>}
            </div>
          )}

          {loading && lands.length === 0 && (
            <div className="loading"><div className="spinner" /><span>Cargando tiempos...</span></div>
          )}

          {error && (
            <div className="card" style={{ borderLeft: '4px solid var(--red)', marginBottom: 12 }}>
              <div className="text-sm">⚠️ No se pudo cargar</div>
              <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => fetchWaitTimes(selectedPark)}>
                Reintentar
              </button>
            </div>
          )}

          {/* Zonas en acordeón */}
          {lands.map(land => (
            <LandSection
              key={land.id ?? land.name}
              land={land}
              isOpen={openLand === land.name}
              onToggle={() => setOpenLand(openLand === land.name ? null : land.name)}
              alarms={alarms}
              onAlarm={ride => alarms[ride.id] ? removeAlarm(ride) : setAddAlarm(ride)}
            />
          ))}

          {lands.length > 0 && allOpenRides.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎢</div>
              <div className="empty-title">Sin atracciones abiertas</div>
              <div className="empty-text">El parque puede estar cerrado o la API no tiene datos en este momento.</div>
            </div>
          )}

          <div className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 14 }}>
            Datos de{' '}
            <a href="https://queue-times.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              Queue-Times.com
            </a>{' '}
            · Actualiza cada 30s
          </div>
        </>
      )}

      {/* ── Modal picker de parque ── */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Elegir parque</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARKS.map(park => (
                <button
                  key={park.id}
                  onClick={() => { setSelectedPark(park); setShowPicker(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `2px solid ${selectedPark.id === park.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedPark.id === park.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{park.emoji}</span>
                  <span style={{ fontWeight: selectedPark.id === park.id ? 700 : 400, fontSize: '0.95rem' }}>
                    {park.name}
                  </span>
                  {selectedPark.id === park.id && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 16 }} onClick={() => setShowPicker(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal alarma ── */}
      {addAlarm && (
        <div className="modal-overlay" onClick={() => setAddAlarm(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">🔔 {addAlarm.name}</div>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Avisamos cuando la fila baje de:
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
