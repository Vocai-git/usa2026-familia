import { NavLink } from 'react-router-dom'

const items = [
  { to: '/',          label: 'Inicio',      icon: '🏠' },
  { to: '/itinerario',label: 'Itinerario',  icon: '📅' },
  { to: '/parques',   label: 'Parques',     icon: '🎢' },
  { to: '/documentos',label: 'Docs',        icon: '📄' },
  { to: '/mas',       label: 'Más',         icon: '☰' },
]

export default function Navigation() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
