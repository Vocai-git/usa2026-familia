import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [perfil, setPerfil] = useState(() => localStorage.getItem('perfil') || 'todos')
  const [people, setPeople] = useState([])
  const [groups, setGroups] = useState({})
  const [stages, setStages] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const cambiarPerfil = (id) => {
    setPerfil(id)
    localStorage.setItem('perfil', id)
  }

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: g }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('people').select('*').order('sort_order'),
      supabase.from('groups').select('*'),
      supabase.from('stages').select('*').order('sort_order'),
      supabase.from('events').select('*').order('date').order('time')
    ])
    setPeople(p || [])
    const groupMap = {}
    ;(g || []).forEach(gr => { groupMap[gr.id] = gr })
    setGroups(groupMap)
    setStages(s || [])
    setEvents(e || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Filtra items según el perfil seleccionado
  // Cada item tiene `people`: array de person IDs o group IDs o "todos"
  const filtrarPorPerfil = useCallback((items) => {
    if (perfil === 'todos') return items
    return items.filter(item => {
      const tags = item.people || []
      if (tags.includes('todos') || tags.length === 0) return true
      if (tags.includes(perfil)) return true
      // Verificar si el perfil está en algún grupo del item
      return tags.some(tag => {
        const grupo = groups[tag]
        return grupo && grupo.member_ids.includes(perfil)
      })
    })
  }, [perfil, groups])

  const getPersona = useCallback((id) => people.find(p => p.id === id), [people])

  return (
    <AppContext.Provider value={{
      perfil, cambiarPerfil,
      people, groups, stages, events,
      loading, cargarDatos,
      filtrarPorPerfil, getPersona
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
