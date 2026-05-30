import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',           icon: '🏠', label: 'Inicio' },
  { to: '/itinerario', icon: '📅', label: 'Viaje' },
  { to: '/parques',    icon: '🎢', label: 'Parques' },
  { to: '/documentos', icon: '📄', label: 'Docs' },
  { to: '/mas',        icon: '⋯',  label: 'Más' },
]

export default function Navigation() {
  return (
    <nav className="bottom-nav">
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
