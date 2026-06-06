import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

export default function Listas() {
  const { isSuper, familyId, families, stages } = useAdmin()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [stageId, setStageId] = useState('')
  const [familyIdF, setFamilyIdF] = useState('')
  const [items, setItems] = useState([''])

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('checklists').select('*, checklist_items(*)')
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    const { data } = await q
    setLists(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId])

  const save = async () => {
    if (!title) return
    const { data: cl } = await supabase.from('checklists').insert({ title, stage_id: stageId || null, people: [], family_id: familyIdF || null }).select().single()
    if (cl) {
      const its = items.filter(i => i.trim()).map((text, sort_order) => ({ checklist_id: cl.id, text, sort_order }))
      if (its.length) await supabase.from('checklist_items').insert(its)
    }
    setModal(false); setTitle(''); setStageId(''); setFamilyIdF(''); setItems([''])
    fetch(); showToast('✅ Lista creada')
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar checklist?')) return
    await supabase.from('checklists').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminada')
  }

  const addItem = () => setItems(i => [...i, ''])
  const setItem = (idx, v) => setItems(i => i.map((it, j) => j === idx ? v : it))

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>✅ Checklists</h1>
          <p className="text-muted text-sm mt-4">Qué llevar, qué hacer antes de salir</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setTitle(''); setStageId(''); setFamilyIdF(isSuper ? '' : familyId); setItems(['']); setModal(true) }}>
          + Nueva lista
        </button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {lists.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-light)', gridColumn: '1/-1' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
              <div className="fw-700">Sin listas todavía</div>
            </div>
          )}
          {lists.map(list => {
            const its = list.checklist_items || []
            return (
              <div key={list.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{list.title}</div>
                    <div className="text-xs text-muted mt-4">{its.length} items · {list.family_id || 'Todos'}</div>
                  </div>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(list.id)}>🗑️</button>
                </div>
                <div style={{ padding: '8px 16px 12px' }}>
                  {its.map(it => (
                    <div key={it.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                      ☐ {it.text}
                    </div>
                  ))}
                  {its.length === 0 && <div className="text-xs text-muted" style={{ padding: '8px 0' }}>Sin items</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">✅ Nueva checklist</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-input" placeholder="Ej: Antes de salir de Alicante" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Etapa</label>
                  <select className="form-select" value={stageId} onChange={e => setStageId(e.target.value)}>
                    <option value="">Sin etapa</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {isSuper && (
                  <div className="form-group">
                    <label className="form-label">Familia</label>
                    <select className="form-select" value={familyIdF} onChange={e => setFamilyIdF(e.target.value)}>
                      <option value="">Compartido</option>
                      {families.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Items</label>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-input" placeholder={`Item ${idx + 1}`} value={item} onChange={e => setItem(idx, e.target.value)} />
                    {items.length > 1 && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setItems(i => i.filter((_, j) => j !== idx))}>✕</button>}
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Agregar item</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>💾 Crear lista</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
