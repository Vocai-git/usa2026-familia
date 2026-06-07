import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function Listas() {
  const { filtrarPorPerfil, family } = useApp()
  const perfil = family?.id ?? 'anon'
  const [checklists, setChecklists] = useState([])
  const [items, setItems] = useState([])
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem(`checks_${perfil}`) || '{}'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('checklists').select('*').order('created_at'),
      supabase.from('checklist_items').select('*').order('sort_order')
    ]).then(([{ data: cl }, { data: it }]) => {
      setChecklists(cl || [])
      setItems(it || [])
      setLoading(false)
    })
  }, [])

  // Reset checked when profile changes
  useEffect(() => {
    setChecked(JSON.parse(localStorage.getItem(`checks_${perfil}`) || '{}'))
  }, [perfil])

  const toggleCheck = (itemId) => {
    const newChecked = { ...checked, [itemId]: !checked[itemId] }
    setChecked(newChecked)
    localStorage.setItem(`checks_${perfil}`, JSON.stringify(newChecked))
  }

  const filteredLists = filtrarPorPerfil(checklists)

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando listas...</span></div>

  if (filteredLists.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title">✅ Listas</h2>
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Sin listas creadas todavía.</p>
          <p className="text-sm" style={{ marginTop: 8 }}>Creá checklists desde el panel admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="page-title">✅ Listas</h2>
      {filteredLists.map(list => {
        const listItems = items.filter(i => i.checklist_id === list.id)
        const doneCount = listItems.filter(i => checked[i.id]).length
        const pct = listItems.length > 0 ? Math.round((doneCount / listItems.length) * 100) : 0

        return (
          <div key={list.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{list.title}</div>
                <div className="text-sm text-muted" style={{ marginTop: 2 }}>{doneCount}/{listItems.length} completados</div>
              </div>
              <span
                className={`badge ${pct === 100 ? 'badge-green' : pct > 0 ? 'badge-yellow' : 'badge-accent'}`}
              >
                {pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: pct === 100 ? 'var(--green)' : 'var(--accent)',
                borderRadius: 2,
                transition: 'width 0.3s ease'
              }} />
            </div>

            {listItems.map(item => (
              <div
                key={item.id}
                className="check-item"
                onClick={() => toggleCheck(item.id)}
              >
                <div className={`check-box${checked[item.id] ? ' checked' : ''}`}>
                  {checked[item.id] && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                </div>
                <span className={`check-text${checked[item.id] ? ' done' : ''}`}>{item.text}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
