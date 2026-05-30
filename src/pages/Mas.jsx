import { Link, Outlet, useLocation } from 'react-router-dom'

const MAS_ITEMS = [
  { to: '/mas/mapa',        icon: '🗺',  label: 'Mapa del viaje',       desc: 'Todos los puntos de interés' },
  { to: '/mas/listas',      icon: '✅',  label: 'Listas y checklists',  desc: 'Qué llevar, qué hacer antes de salir' },
  { to: '/mas/alarmas',     icon: '🔔',  label: 'Alarmas',              desc: 'Check-ins, crucero, devolución del auto' },
  { to: '/mas/emergencias', icon: '🆘',  label: 'Emergencias',          desc: 'Contactos, teléfonos, tips de seguridad' },
  { to: '/admin',           icon: '⚙️',  label: 'Panel Admin',          desc: 'Cargar datos del viaje (solo Agustín)' },
]

export default function Mas() {
  const location = useLocation()
  const isSub = location.pathname !== '/mas'

  if (isSub) return <Outlet />

  return (
    <div className="page">
      <h2 className="page-title">☰ Más</h2>
      {MAS_ITEMS.map(({ to, icon, label, desc }) => (
        <Link key={to} to={to} style={{ display: 'block', marginBottom: 8 }}>
          <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
              <div className="text-sm text-muted" style={{ marginTop: 2 }}>{desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
          </div>
        </Link>
      ))}

      <div className="section-title" style={{ marginTop: 24 }}>📱 Instalar en el teléfono</div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>¿Cómo instalar la app?</div>
        <div className="text-sm" style={{ lineHeight: 1.6 }}>
          <strong>iPhone (Safari):</strong> Tocá el botón compartir → "Agregar a inicio"<br />
          <strong>Android (Chrome):</strong> Menú → "Instalar app" o "Agregar a pantalla de inicio"
        </div>
      </div>

      <div className="section-title">💱 Conversor USD/EUR</div>
      <Conversor />

      <div className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 24, paddingBottom: 8 }}>
        USA 2026 · Hecho con ❤️ para la familia
      </div>
    </div>
  )
}

function Conversor() {
  const RATE = 0.91 // EUR por USD — actualizar antes del viaje
  const [usd, setUsd] = useState('')
  const eur = usd ? (parseFloat(usd) * RATE).toFixed(2) : ''

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div className="form-label">USD $</div>
          <input
            className="form-input"
            type="number"
            placeholder="0.00"
            value={usd}
            onChange={e => setUsd(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div style={{ fontSize: '1.5rem', marginTop: 20 }}>→</div>
        <div style={{ flex: 1 }}>
          <div className="form-label">EUR €</div>
          <div className="form-input" style={{ background: 'var(--surface2)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>
            {eur || '—'}
          </div>
        </div>
      </div>
      <div className="text-sm text-muted" style={{ marginTop: 8 }}>
        Tasa referencia: 1 USD = {RATE} EUR · Actualizar antes de viajar
      </div>
    </div>
  )
}
