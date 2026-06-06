import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)

const SUPER_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'usa2026admin'

export function AdminProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_session') || 'null') } catch { return null }
  })
  const [families, setFamilies] = useState([])
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)

  const login = (family, role = 'family') => {
    const s = { family, role }
    setSession(s)
    localStorage.setItem('admin_session', JSON.stringify(s))
  }
  const logout = () => {
    setSession(null)
    localStorage.removeItem('admin_session')
  }

  const tryLogin = (family, code) => {
    if (!family && code === SUPER_PASS) {
      login({ id: 'moledo', name: 'Familia Moledo', emoji: '🦋', color: '#2563EB' }, 'superadmin')
      return true
    }
    if (family && code === family.access_code) { login(family, 'family'); return true }
    return false
  }

  const isSuper = session?.role === 'superadmin'
  const familyId = session?.family?.id

  const reload = useCallback(async () => {
    setLoading(true)
    const [{ data: f }, { data: s }] = await Promise.all([
      supabase.from('families').select('*'),
      supabase.from('stages').select('*').order('sort_order'),
    ])
    setFamilies(f || [])
    setStages(s || [])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <Ctx.Provider value={{ session, isSuper, familyId, families, stages, loading, reload, tryLogin, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAdmin = () => useContext(Ctx)
