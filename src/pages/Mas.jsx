import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const MAS_ITEMS = [
  { to: '/mas/mapa',        icon: '🗺',  label: 'Mapa del viaje',      desc: 'Todos los puntos de interés' },
  { to: '/mas/gastos',      icon: '💰',  label: 'Gastos',              desc: 'Lo que va gastando tu familia' },
  { to: '/mas/listas',      icon: '✅',  label: 'Checklists',          desc: 'Qué llevar, qué hacer' },
  { to: '/mas/alarmas',     icon: '🔔',  label: 'Alarmas',             desc: 'Check-ins, vuelos, crucero' },
  { to: '/mas/emergencias', icon: '🆘',  label: 'Emergencias',         desc: 'Contactos y teléfonos offline' },
]

export default function Mas() {
  const location = useLocation()
  const { isAdmin, stages, family } = useApp()
  const verNY = isAdmin || family?.id === 'moledo'
  const items = verNY
    ? [MAS_ITEMS[0], { to: '/mas/nuevayork', icon: '🗽', label: 'Nueva York', desc: 'Llegar del aeropuerto y moverse' }, ...MAS_ITEMS.slice(1)]
    : MAS_ITEMS
  if (location.pathname !== '/mas') return <Outlet />

  return (
    <div className="page">
      <h2 className="page-title">Más</h2>

      {items.map(({ to, icon, label, desc }) => (
        <Link key={to} to={to} style={{ display: 'block', marginBottom: 8 }}>
          <div className="card-pressable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, flexShrink: 0,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.4rem'
            }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="fw-700" style={{ fontSize: '0.92rem' }}>{label}</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>{desc}</div>
            </div>
            <span style={{ color: 'var(--text-light)' }}>›</span>
          </div>
        </Link>
      ))}

      {isAdmin && (
        <>
          <div className="section-label" style={{ marginTop: 24 }}>Administración</div>
          <Link to="/admin" style={{ display: 'block' }}>
            <div className="card-pressable" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'var(--accent)', background: 'var(--accent-bg)' }}>
              <div style={{ width: 44, height: 44, flexShrink: 0, background: 'var(--accent)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚙️</div>
              <div style={{ flex: 1 }}>
                <div className="fw-700" style={{ fontSize: '0.92rem', color: 'var(--accent)' }}>Panel Admin</div>
                <div className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7, marginTop: 2 }}>Gestionar datos del viaje</div>
              </div>
              <span style={{ color: 'var(--accent)' }}>›</span>
            </div>
          </Link>
        </>
      )}

      <div className="section-label">💱 Conversor USD / EUR</div>
      <Conversor />

      <div className="section-label">📱 Instalar en el móvil</div>
      <div className="card">
        <div className="fw-700" style={{ marginBottom: 8, fontSize: '0.9rem' }}>¿Cómo instalar la app?</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
          <strong>iPhone:</strong> Safari → compartir → "Agregar a inicio"<br />
          <strong>Android:</strong> Chrome → menú → "Instalar app"
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 8 }} className="text-xs text-light">
        USA 2026 · Hecho con ❤️ para la familia
      </div>
    </div>
  )
}

function Conversor() {
  const RATE = 0.91
  const [usd, setUsd] = useState('')
  const eur = usd ? (parseFloat(usd) * RATE).toFixed(2) : ''
  return (
    <div className="card">
      <div className="conversor-box">
        <div style={{ flex: 1 }}>
          <div className="conversor-label">USD $</div>
          <input
            className="form-input"
            type="number"
            placeholder="0.00"
            value={usd}
            onChange={e => setUsd(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div style={{ color: 'var(--text-light)', fontSize: '1.2rem', paddingTop: 22 }}>→</div>
        <div style={{ flex: 1 }}>
          <div className="conversor-label">EUR €</div>
          <div className="conversor-result">{eur || '—'}</div>
        </div>
      </div>
      <div className="text-xs text-light" style={{ marginTop: 8 }}>
        Tasa referencia: 1 USD = {RATE} EUR
      </div>
    </div>
  )
}
