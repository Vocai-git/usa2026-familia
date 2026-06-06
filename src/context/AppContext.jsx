import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const SUPER_ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSWORD || 'usa2026admin'

export function AppProvider({ children }) {
  const [family, setFamily] = useState(() => {
    try { return JSON.parse(localStorage.getItem('family') || 'null') } catch { return null }
  })
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('is_admin') === '1')
  const [families, setFamilies] = useState([])
  const [people, setPeople] = useState([])
  const [groups, setGroups] = useState({})
  const [stages, setStages] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const enterFamily = (fam, admin = false) => {
    setFamily(fam)
    localStorage.setItem('family', JSON.stringify(fam))
    if (admin) {
      setIsAdmin(true)
      localStorage.setItem('is_admin', '1')
    }
  }

  const exitFamily = () => {
    setFamily(null)
    setIsAdmin(false)
    localStorage.removeItem('family')
    localStorage.removeItem('is_admin')
  }

  const reload = useCallback(async () => {
    setLoading(true)
    const [{ data: fams }, { data: p }, { data: g }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('families').select('*'),
      supabase.from('people').select('*').order('sort_order'),
      supabase.from('groups').select('*'),
      supabase.from('stages').select('*').order('sort_order'),
      supabase.from('events').select('*').order('date').order('time')
    ])
    setFamilies(fams || [])
    setPeople(p || [])
    const gm = {}
    ;(g || []).forEach(gr => { gm[gr.id] = gr })
    setGroups(gm)
    setStages(s || [])
    setEvents(e || [])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  // Filtra por family_id: muestra los de la familia actual + los compartidos (family_id null)
  const filtrarEventos = useCallback((items) => {
    return items.filter(item => {
      if (!item.family_id) return true
      if (isAdmin) return true
      return item.family_id === family?.id
    })
  }, [family, isAdmin])

  // Alias usado en Documentos y Códigos (filtra por people[] o family_id)
  const filtrarPorPerfil = useCallback((items) => {
    return items.filter(item => {
      if (!item.family_id) return true
      if (isAdmin) return true
      return item.family_id === family?.id
    })
  }, [family, isAdmin])

  const getPersona = useCallback((id) => people.find(p => p.id === id), [people])

  const loginAdmin = (code) => {
    if (code === SUPER_ADMIN_CODE) {
      const adminFam = { id: 'moledo', name: 'Familia Moledo', emoji: '🦋', color: '#2563EB' }
      enterFamily(adminFam, true)
      return true
    }
    return false
  }

  const loginFamily = (fam, code) => {
    if (code === fam.access_code) {
      enterFamily(fam, false)
      return true
    }
    return false
  }

  return (
    <AppContext.Provider value={{
      family, isAdmin,
      families, people, groups, stages, events,
      loading, reload,
      filtrarEventos, filtrarPorPerfil, getPersona,
      enterFamily, exitFamily, loginAdmin, loginFamily,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
