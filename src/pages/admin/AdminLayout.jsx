import { Outlet, NavLink } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import AdminSidebar from '../../components/AdminSidebar'
import Toast from '../../components/Toast'
import Login from './Login'
import '../../styles/admin-extra.css'

export default function AdminLayout() {
  const { session } = useAdmin()
  if (!session) return <Login />
  return (
    <div className="layout">
      <AdminSidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">USA 2026 · Panel de gestión</div>
          <NavLink
            to="/"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            📱 Ver app móvil
          </NavLink>
        </div>
        <Outlet />
        <Toast />
      </div>
    </div>
  )
}
