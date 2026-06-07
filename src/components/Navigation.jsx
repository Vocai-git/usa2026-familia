import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const NAV = [
  { to: '/',           icon: '🏠', label: 'Inicio' },
  { to: '/itinerario', icon: '📅', label: 'Viaje' },
  { to: '/parques',    icon: '🎢', label: 'Parques' },
  { to: '/documentos', icon: '📄', label: 'Docs' },
  { to: '/mas',        icon: '⋯',  label: 'Más' },
]

export default function Navigation() {
  const { stages, family, isAdmin } = useApp()
  const verMundial = isAdmin || stages.some(s => s.id === 'mundial' && s.families?.includes(family?.id))
  const items = verMundial
    ? [...NAV.slice(0, 4), { to: '/mundial', icon: '⚽', label: 'Mundial' }, NAV[4]]
    : NAV

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon, label }) => (
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
