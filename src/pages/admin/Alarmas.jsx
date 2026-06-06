import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

const PRESETS = [
  { label: 'Check-in vuelo (24h antes)', offset: -24*60, action_label: 'Hacer check-in', action_url: 'https://www.aa.com/checkin' },
  { label: 'Check-in crucero Royal Caribbean', offset: 0, action_label: 'Check-in Royal Caribbean', action_url: 'https://www.royalcaribbean.com/account/login' },
  { label: 'Devolución auto (1h antes)', offset: -60, action_label: 'Preparar devolución', action_url: '' },
  { label: 'Check-out hotel', offset: -120, action_label: '', action_url: '' },
]

export default function Alarmas() {
  const { isSuper, familyId, families } = useAdmin()
  const [alarms, setAlarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', trigger_at: '', action_label: '', action_url: '', family_id: '' })

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('alarms').select('*').order('trigger_at')
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    const { data } = await q
    setAlarms(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const applyPreset = (p) => setForm(f => ({ ...f, title: p.label, action_label: p.action_label, action_url: p.action_url }))

  const save = async () => {
    if (!form.title || !form.trigger_at) return
    const action = form.action_label ? { type: 'url', label: form.action_label, url: form.action_url } : {}
    await supabase.from('alarms').insert({ title: form.title, trigger_at: form.trigger_at, action, people: [], is_active: true, family_id: form.family_id || null })
    setModal(false)
    setForm({ title: '', trigger_at: '', action_label: '', action_url: '', family_id: '' })
    fetch(); showToast('✅ Alarma creada')
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('alarms').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminada')
  }

  const toggle = async (id, current) => {
    await supabase.from('alarms').update({ is_active: !current }).eq('id', id)
    fetch()
  }

  const timeUntil = (dt) => {
    const diff = new Date(dt) - new Date()
    if (diff < 0) return { label: 'Pasada', past: true }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    if (d > 0) return { label: `En ${d}d ${h}h`, past: false }
    return { label: `En ${h}h`, past: false }
  }

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>🔔 Alarmas</h1>
          <p className="text-muted text-sm mt-4">Check-ins, recordatorios, devoluciones</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: '', trigger_at: '', action_label: '', action_url: '', family_id: isSuper ? '' : familyId }); setModal(true) }}>
          + Nueva alarma
        </button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Alarma</th>
                <th>Cuándo</th>
                <th>Tiempo</th>
                <th>Estado</th>
                {isSuper && <th>Familia</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alarms.length === 0 && <tr><td colSpan={isSuper ? 6 : 5} className="table-empty">Sin alarmas.</td></tr>}
              {alarms.map(a => {
                const { label: timeLabel, past } = timeUntil(a.trigger_at)
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-700 text-sm">{a.title}</div>
                      {a.action?.label && <div className="text-xs text-muted mt-4">→ {a.action.label}</div>}
                    </td>
                    <td className="text-sm">{new Date(a.trigger_at).toLocaleString('es-ES', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                    <td><span className={`badge ${past ? 'badge-gray' : 'badge-green'}`}>{timeLabel}</span></td>
                    <td>
                      <button onClick={() => toggle(a.id, a.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span className={`badge ${a.is_active ? 'badge-blue' : 'badge-gray'}`}>{a.is_active ? '● Activa' : '○ Inactiva'}</span>
                      </button>
                    </td>
                    {isSuper && <td>{a.family_id ? <span className="badge badge-blue">{a.family_id}</span> : <span className="badge badge-gray">Todos</span>}</td>}
                    <td><button className="btn btn-danger btn-sm btn-icon" onClick={() => del(a.id)}>🗑️</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🔔 Nueva alarma</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>⚡ Plantillas rápidas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PRESETS.map(p => (
                    <button key={p.label} className="btn btn-secondary btn-sm" onClick={() => applyPreset(p)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Check-in vuelo AA990" />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Fecha y hora *</label>
                <input className="form-input" type="datetime-local" value={form.trigger_at} onChange={e => set('trigger_at', e.target.value)} />
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Texto del botón</label>
                  <input className="form-input" placeholder="Hacer check-in" value={form.action_label} onChange={e => set('action_label', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL del botón</label>
                  <input className="form-input" type="url" placeholder="https://..." value={form.action_url} onChange={e => set('action_url', e.target.value)} />
                </div>
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
