import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

export default function Codigos() {
  const { isSuper, familyId, families } = useAdmin()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ label: '', code: '', sub_info: '', family_id: '' })

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('codes').select('*').order('label')
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    const { data } = await q
    setCodes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.label || !form.code) return
    await supabase.from('codes').insert({ ...form, family_id: form.family_id || null })
    setModal(false)
    setForm({ label: '', code: '', sub_info: '', family_id: '' })
    fetch(); showToast('✅ Código guardado')
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('codes').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminado')
  }

  const copy = (code, label) => {
    navigator.clipboard.writeText(code)
    showToast(`📋 ${label} copiado`)
  }

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>🔑 Códigos y reservas</h1>
          <p className="text-muted text-sm mt-4">PNR, confirmaciones, localizadores</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ label: '', code: '', sub_info: '', family_id: isSuper ? '' : familyId }); setModal(true) }}>
          + Agregar código
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Código</th>
                <th>Info adicional</th>
                {isSuper && <th>Familia</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr><td colSpan={isSuper ? 5 : 4} className="table-empty">Sin códigos. Agregá el primero.</td></tr>
              )}
              {codes.map(c => (
                <tr key={c.id}>
                  <td className="fw-700">{c.label}</td>
                  <td>
                    <code style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                      {c.code}
                    </code>
                  </td>
                  <td className="text-muted text-sm">{c.sub_info || '—'}</td>
                  {isSuper && (
                    <td>
                      {c.family_id
                        ? <span className="badge badge-blue">{c.family_id}</span>
                        : <span className="badge badge-gray">Todos</span>
                      }
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => copy(c.code, c.label)}>📋</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🔑 Nuevo código</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Etiqueta *</label>
                <input className="form-input" placeholder="Ej: PNR vuelo AA990" value={form.label} onChange={e => set('label', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Código *</label>
                <input className="form-input mono" style={{ fontSize: '1.1rem', letterSpacing: '0.08em' }} placeholder="K8R2L9" value={form.code} onChange={e => set('code', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Info adicional</label>
                <input className="form-input" placeholder="Ej: American Airlines, 10 jun" value={form.sub_info} onChange={e => set('sub_info', e.target.value)} />
              </div>
              {isSuper && (
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Familia</label>
                  <select className="form-select" value={form.family_id} onChange={e => set('family_id', e.target.value)}>
                    <option value="">Compartido (todos)</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
