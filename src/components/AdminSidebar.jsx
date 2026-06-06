import { NavLink } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const NAV = [
  { section: 'Viaje', items: [
    { to: '/admin',          icon: '📊', label: 'Dashboard' },
    { to: '/admin/eventos',  icon: '📅', label: 'Eventos' },
    { to: '/admin/documentos', icon: '📄', label: 'Documentos' },
    { to: '/admin/codigos',  icon: '🔑', label: 'Códigos y reservas' },
    { to: '/admin/alarmas',  icon: '🔔', label: 'Alarmas' },
  ]},
  { section: 'Más', items: [
    { to: '/admin/destinos', icon: '🗺', label: 'Destinos / Etapas' },
    { to: '/admin/mapa',     icon: '📍', label: 'Pines del mapa' },
    { to: '/admin/listas',   icon: '✅', label: 'Checklists' },
  ]},
]
const ADMIN_NAV = { section: 'Administración', items: [
  { to: '/admin/familias', icon: '👨‍👩‍👧‍👦', label: 'Familias' },
]}

export default function AdminSidebar() {
  const { session, isSuper, logout } = useAdmin()
  const fam = session?.family

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">🇺🇸 USA 2026</div>
        <div className="sidebar-sub">Panel de gestión</div>
      </div>

      {fam && (
        <div className="sidebar-family">
          <span className="family-badge">{fam.emoji}</span>
          <div>
            <div className="family-name">{fam.name}</div>
            <div className="family-role">{isSuper ? 'Super Admin' : 'Familiar'}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ section, items }) => (
          <div key={section} className="nav-section">
            <div className="nav-label">{section}</div>
            {items.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
        {isSuper && (
          <div className="nav-section">
            <div className="nav-label">{ADMIN_NAV.section}</div>
            {ADMIN_NAV.items.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="nav-link" style={{ marginBottom: 4 }}>
          <span className="icon">📱</span>
          Ver app móvil
        </NavLink>
        <button className="logout-btn" onClick={logout}>
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
