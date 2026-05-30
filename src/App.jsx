import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ProfileSelector from './components/ProfileSelector'
import Navigation from './components/Navigation'
import Inicio from './pages/Inicio'
import Itinerario from './pages/Itinerario'
import Parques from './pages/Parques'
import Documentos from './pages/Documentos'
import Mas from './pages/Mas'
import Mapa from './pages/Mapa'
import Listas from './pages/Listas'
import Alarmas from './pages/Alarmas'
import Emergencias from './pages/Emergencias'
import Admin from './pages/Admin'
import './styles/main.css'

export default function App() {
  return (
    <BrowserRouter basename="/usa2026-familia">
      <AppProvider>
        <div id="root">
          <header className="app-header">
            <h1>🇺🇸 USA 2026</h1>
          </header>
          <ProfileSelector />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/itinerario" element={<Itinerario />} />
              <Route path="/parques" element={<Parques />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/mas" element={<Mas />}>
                <Route path="mapa" element={<Mapa />} />
                <Route path="listas" element={<Listas />} />
                <Route path="alarmas" element={<Alarmas />} />
                <Route path="emergencias" element={<Emergencias />} />
              </Route>
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Navigation />
        </div>
      </AppProvider>
    </BrowserRouter>
  )
}
