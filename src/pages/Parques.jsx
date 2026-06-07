import { useState, useEffect, useRef, useCallback } from 'react'
import { infoAtraccion } from '../data/atracciones'

const PARKS = [
  { id: 334, name: 'Epic Universe',         emoji: '🌌' },
  { id: 65,  name: 'Universal Studios',     emoji: '🎬' },
  { id: 64,  name: 'Islands of Adventure',  emoji: '🏝' },
  { id: 'volcano', name: 'Volcano Bay',     emoji: '🌋' },
]

const BUCKETS = [
  { key: 'fast',   label: 'Menos de 15 min',  color: '#22c55e', bg: '#dcfce7', min: 0,  max: 14  },
  { key: 'medium', label: '15 a 30 min',       color: '#f59e0b', bg: '#fef9c3', min: 15, max: 30  },
  { key: 'slow',   label: '30 a 45 min',       color: '#f97316', bg: '#ffedd5', min: 31, max: 45  },
  { key: 'long',   label: 'Más de 45 min',     color: '#ef4444', bg: '#fee2e2', min: 46, max: 999 },
]

const BUCKET_EMOJI = { fast: '🟢', medium: '🟡', slow: '🟠', long: '🔴' }

function readParkAlarms() {
  try { return JSON.parse(localStorage.getItem('park_alarms') || '{}') } catch { return {} }
}

function RideBanner({ info, name }) {
  const [err, setErr] = useState(false)
  if (info.img && !err) {
    return (
      <div style={{ position: 'relative', height: 190, background: info.color }}>
        <img src={info.img} alt={name} onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 55%)' }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12, color: '#fff' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.95, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.emoji} {info.tipo}</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`, padding: '28px 20px', textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: '3.4rem', lineHeight: 1 }}>{info.emoji}</div>
      <div style={{ marginTop: 10, fontWeight: 800, fontSize: '1.15rem' }}>{name}</div>
      <div style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.tipo}</div>
    </div>
  )
}

function BucketSection({ bucket, rides, isOpen, onToggle, onSelect }) {
  const sorted = [...rides].sort((a, b) => a.wait_time - b.wait_time)

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
          background: isOpen ? bucket.bg : 'var(--surface)',
          border: `1px solid ${isOpen ? bucket.color : 'var(--border)'}`,
          borderRadius: isOpen ? '12px 12px 0 0' : 12,
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8,
          boxSizing: 'border-box',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{BUCKET_EMOJI[bucket.key]}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isOpen ? bucket.color : 'var(--text)' }}>
              {bucket.label}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {rides.length === 0 ? 'Sin atracciones' : `${rides.length} atracción${rides.length > 1 ? 'es' : ''}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rides.length > 0 && (
            <span style={{
              background: bucket.color,
              color: '#fff',
              borderRadius: 20,
              padding: '2px 9px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}>
              {rides.length}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {isOpen && rides.length > 0 && (
        <div style={{
          border: `1px solid ${bucket.color}`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
        }}>
          {sorted.map((ride, i) => {
            const info = infoAtraccion(ride.name)
            return (
              <button
                key={ride.id}
                onClick={() => onSelect({ ...ride, info })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                  background: 'var(--surface)',
                  gap: 10,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{info.emoji}</span>
                <div style={{ flex: 1, fontSize: '0.84rem', lineHeight: 1.3, minWidth: 0 }}>
                  {ride.name}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{info.tipo} · ver info ›</div>
                </div>
                <div style={{
                  background: bucket.color,
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
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

async function getPushSub() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const sw = await navigator.serviceWorker.ready
  return sw.pushManager.getSubscription()
}

// Safari/iOS exige la clave VAPID como Uint8Array (no string base64url)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function subscribeAndSave(alarms) {
  const r = await fetch('/api/push/vapid-key')
  const { publicKey } = await r.json()
  if (!publicKey) throw new Error('Falta la clave VAPID en el servidor')
  const sw = await navigator.serviceWorker.ready
  const sub = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub, alarms })
  })
  return sub
}

function syncAlarms(sub, alarms) {
  fetch('/api/push/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, alarms })
  }).catch(() => {})
}

export default function Parques() {
  const [selectedPark, setSelectedPark] = useState(PARKS[0])
  const [showPicker, setShowPicker] = useState(false)
  const [lands, setLands] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [openBucket, setOpenBucket] = useState('fast')
  const [notifActive, setNotifActive] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifMsg, setNotifMsg] = useState(null)
  const [selectedRide, setSelectedRide] = useState(null)
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
    setError(false)
    clearInterval(intervalRef.current)
    if (selectedPark.id !== 'volcano') {
      fetchWaitTimes(selectedPark)
      intervalRef.current = setInterval(() => fetchWaitTimes(selectedPark), 30 * 1000)
    }
    // Check if global notif is active for this park
    const saved = readParkAlarms()
    setNotifActive(!!saved[`_global_${selectedPark.id}`]?.active)
    return () => clearInterval(intervalRef.current)
  }, [selectedPark, fetchWaitTimes])

  // Todas las atracciones abiertas con tiempo conocido
  const allOpen = lands.flatMap(l => (l.rides || []).filter(r => r.is_open && r.wait_time !== null))

  // Distribuir en buckets
  const bucketed = BUCKETS.map(b => ({
    ...b,
    rides: allOpen.filter(r => r.wait_time >= b.min && r.wait_time <= b.max),
  }))

  const toggleNotif = async () => {
    setNotifLoading(true)
    setNotifMsg(null)
    try {
      const globalKey = `_global_${selectedPark.id}`
      const saved = readParkAlarms()

      if (notifActive) {
        // Desactivar
        delete saved[globalKey]
        localStorage.setItem('park_alarms', JSON.stringify(saved))
        setNotifActive(false)
        const sub = await getPushSub()
        if (sub) syncAlarms(sub, saved)
      } else {
        // Activar — con feedback explícito en cada caso (nunca falla en silencio)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const soportePush = typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

        if (!soportePush) {
          setNotifMsg(iOS && !isStandalone
            ? '📲 En iPhone las notificaciones solo funcionan con la app instalada. Abrí Safari → botón Compartir → "Agregar a inicio", y entrá desde ese ícono.'
            : 'Tu navegador no soporta notificaciones push.')
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setNotifMsg(permission === 'denied'
            ? '⚠️ Tenés las notificaciones bloqueadas. Activálas en Ajustes del teléfono → Notificaciones → USA 2026 (o en Safari para este sitio).'
            : 'Necesito tu permiso de notificaciones para avisarte.')
          return
        }

        saved[globalKey] = { type: 'global', parkId: selectedPark.id, threshold: 15, active: true }
        localStorage.setItem('park_alarms', JSON.stringify(saved))

        let sub = await getPushSub()
        if (!sub) sub = await subscribeAndSave(saved)
        else syncAlarms(sub, saved)

        setNotifActive(true)
        setNotifMsg('✅ Listo, te avisamos cuando una atracción baje de 15 min.')
      }
    } catch (e) {
      console.error(e)
      setNotifMsg('No se pudo activar: ' + (e?.message || 'error desconocido') + '. Probá instalando la app a la pantalla de inicio.')
      setNotifActive(false)
    } finally {
      setNotifLoading(false)
    }
  }

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

          {/* Buckets acordeón */}
          {bucketed.map(b => (
            <BucketSection
              key={b.key}
              bucket={b}
              rides={b.rides}
              isOpen={openBucket === b.key}
              onToggle={() => setOpenBucket(openBucket === b.key ? null : b.key)}
              onSelect={setSelectedRide}
            />
          ))}

          {lands.length > 0 && allOpen.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎢</div>
              <div className="empty-title">Sin atracciones abiertas</div>
              <div className="empty-text">El parque puede estar cerrado o la API no tiene datos en este momento.</div>
            </div>
          )}

          {/* ── Notificaciones ── */}
          {lands.length > 0 && (
            <div
              className="card"
              style={{
                marginTop: 16,
                borderLeft: `4px solid ${notifActive ? '#22c55e' : 'var(--border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                    {notifActive ? '🔔 Notificaciones activas' : '🔕 Notificaciones desactivadas'}
                  </div>
                  <div className="text-sm text-muted">
                    {notifActive
                      ? `Te avisamos cuando una atracción de ${selectedPark.name} baje de 15 min, aunque tengas la app cerrada.`
                      : 'Recibí un ping cuando una atracción baje de 15 min, con el teléfono en el bolsillo.'}
                  </div>
                </div>
                <button
                  onClick={toggleNotif}
                  disabled={notifLoading}
                  className={`btn btn-sm ${notifActive ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flexShrink: 0 }}
                >
                  {notifLoading ? '...' : notifActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              {notifMsg && (
                <div className="text-sm" style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: notifActive ? '#ecfdf5' : '#fff7ed', color: notifActive ? '#065f46' : '#9a3412', lineHeight: 1.45 }}>
                  {notifMsg}
                </div>
              )}
              {notifActive && (
                <div className="text-sm text-muted" style={{ marginTop: 8 }}>
                  💡 Para recibirlas con la app cerrada, instalá la PWA: Safari → Compartir → Agregar a inicio.
                </div>
              )}
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

      {/* ── Detalle de atracción ── */}
      {selectedRide && (
        <div className="modal-overlay" onClick={() => setSelectedRide(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
            <RideBanner info={selectedRide.info} name={selectedRide.name} />
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  background: selectedRide.info.color, color: '#fff', borderRadius: 20,
                  padding: '4px 12px', fontWeight: 700, fontSize: '0.85rem',
                }}>
                  ⏱️ {selectedRide.wait_time} min de espera
                </span>
              </div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text)' }}>
                {selectedRide.info.desc}
              </p>
              <button className="btn btn-secondary btn-block" style={{ marginTop: 18 }} onClick={() => setSelectedRide(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Picker de parque ── */}
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
                    boxSizing: 'border-box',
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
    </div>
  )
}
