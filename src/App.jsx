import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AdminProvider } from './context/AdminContext'
import Navigation from './components/Navigation'
import Onboarding from './pages/Onboarding'
import Inicio from './pages/Inicio'
import Itinerario from './pages/Itinerario'
import Parques from './pages/Parques'
import Documentos from './pages/Documentos'
import Mas from './pages/Mas'
import Mapa from './pages/Mapa'
import Listas from './pages/Listas'
import Alarmas from './pages/Alarmas'
import Emergencias from './pages/Emergencias'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminEventos from './pages/admin/Eventos'
import AdminDocumentos from './pages/admin/Documentos'
import AdminCodigos from './pages/admin/Codigos'
import AdminAlarmas from './pages/admin/Alarmas'
import AdminMapa from './pages/admin/Mapa'
import AdminListas from './pages/admin/Listas'
import AdminFamilias from './pages/admin/Familias'
import AdminDestinos from './pages/admin/Destinos'
import './styles/main.css'

function AppShell() {
  const { family, isAdmin, exitFamily } = useApp()

  if (!family) return <Onboarding />

  return (
    <>
      <header className="app-header">
        <div className="app-header-title">🇺🇸 USA 2026</div>
        <div className="family-chip" onClick={exitFamily}>
          <span>{family.emoji}</span>
          <span>{family.name}</span>
          {isAdmin && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem' }}>admin</span>}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/"            element={<Inicio />} />
          <Route path="/itinerario"  element={<Itinerario />} />
          <Route path="/parques"     element={<Parques />} />
          <Route path="/documentos"  element={<Documentos />} />
          <Route path="/mas"         element={<Mas />}>
            <Route path="mapa"        element={<Mapa />} />
            <Route path="listas"      element={<Listas />} />
            <Route path="alarmas"     element={<Alarmas />} />
            <Route path="emergencias" element={<Emergencias />} />
          </Route>
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Navigation />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <AdminProvider>
              <AdminLayout />
            </AdminProvider>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="eventos"    element={<AdminEventos />} />
          <Route path="documentos" element={<AdminDocumentos />} />
          <Route path="codigos"    element={<AdminCodigos />} />
          <Route path="alarmas"    element={<AdminAlarmas />} />
          <Route path="mapa"       element={<AdminMapa />} />
          <Route path="listas"     element={<AdminListas />} />
          <Route path="familias"   element={<AdminFamilias />} />
          <Route path="destinos"   element={<AdminDestinos />} />
        </Route>
        <Route
          path="*"
          element={
            <AppProvider>
              <div id="root">
                <AppShell />
              </div>
            </AppProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
