import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

const COLORS = [
  '#2563EB', '#7C3AED', '#16A34A', '#DC2626',
  '#D97706', '#0891B2', '#DB2777', '#059669'
]
const EMOJIS = ['🎡', '🚢', '🌴', '🗽', '✈️', '🏖️', '🎢', '🏙️', '⛷️', '🗺️']

export default function Destinos() {
  const { stages, reload } = useAdmin()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ id: '', name: '', from_date: '', to_date: '', color: '#2563EB', emoji: '🗺️', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    const nextOrder = Math.max(0, ...stages.map(s => s.sort_order || 0)) + 1
    setForm({ id: '', name: '', from_date: '', to_date: '', color: '#2563EB', emoji: '🗺️', sort_order: nextOrder })
    setEditing(null)
    setModal(true)
  }

  const openEdit = (stage) => {
    setForm({ ...stage })
    setEditing(stage.id)
    setModal(true)
  }

  const save = async () => {
    if (!form.name || !form.from_date || !form.to_date) return
    setSaving(true)
    const id = form.id || form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const payload = { id, name: form.name, from_date: form.from_date, to_date: form.to_date, color: form.color, sort_order: Number(form.sort_order) || 0 }

    if (editing) {
      await supabase.from('stages').update(payload).eq('id', editing)
    } else {
      const { error } = await supabase.from('stages').insert(payload)
      if (error) { showToast('❌ ID duplicado — cambiá el nombre'); setSaving(false); return }
    }
    setSaving(false)
    setModal(false)
    reload()
    showToast(editing ? '✅ Destino actualizado' : '✅ Destino creado')
  }

  const del = async (id) => {
    if (!confirm(`¿Eliminar la etapa "${id}"? Los eventos asociados quedarán sin etapa.`)) return
    await supabase.from('stages').delete().eq('id', id)
    reload()
    showToast('🗑️ Eliminado')
  }

  const days = (from, to) => Math.max(0, Math.round((new Date(to) - new Date(from)) / 86400000))

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>🗺 Destinos y etapas</h1>
          <p className="text-muted text-sm mt-4">Las fases del viaje — cada familia puede agregar las suyas</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo destino</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {stages.map(s => (
          <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: s.color, padding: '16px 20px', color: '#fff' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.emoji || '🗺️'}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>{s.name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 3 }}>{s.from_date} → {s.to_date}</div>
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color }}>{days(s.from_date, s.to_date)}</span>
                <span className="text-xs text-muted" style={{ marginLeft: 4 }}>días · orden {s.sort_order}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(s.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}

        {stages.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)', gridColumn: '1/-1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🗺</div>
            <div className="fw-700">Sin destinos todavía</div>
            <div className="text-sm" style={{ marginTop: 4 }}>Agregá las etapas del viaje</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20, padding: '16px 20px' }}>
        <div className="fw-700" style={{ marginBottom: 8 }}>💡 Cómo usar los destinos</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
          Cada evento (vuelo, hotel, actividad) se asocia a un destino. Si tu familia va a un lugar que no está en la lista, agregalo acá primero y luego asignale los eventos desde la sección Eventos.
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Editar destino' : '🗺 Nuevo destino'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: form.color, borderRadius: 10, padding: '14px 18px', color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.8rem' }}>{form.emoji || '🗺️'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.name || 'Nombre del destino'}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{form.from_date || 'dd/mm'} → {form.to_date || 'dd/mm'}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del destino *</label>
                <input className="form-input" placeholder="Ej: Orlando, Miami..." value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Fecha de inicio *</label>
                  <input className="form-input" type="date" value={form.from_date} onChange={e => set('from_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de fin *</label>
                  <input className="form-input" type="date" value={form.to_date} onChange={e => set('to_date', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Emoji del destino</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => set('emoji', e)}
                      style={{
                        width: 36, height: 36, fontSize: '1.2rem',
                        borderRadius: 8, border: `2px solid ${form.emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.emoji === e ? 'var(--accent-bg)' : 'var(--surface)',
                        cursor: 'pointer'
                      }}
                    >
                      {e}
                    </button>
                  ))}
                  <input className="form-input" style={{ width: 60 }} placeholder="✏️" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={2} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => set('color', c)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, background: c,
                        border: form.color === c ? '3px solid var(--text)' : '2px solid transparent',
                        cursor: 'pointer',
                        outline: form.color === c ? '2px solid white' : 'none',
                        outlineOffset: '-4px'
                      }}
                    />
                  ))}
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 28, height: 28, padding: 1, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Orden de aparición</label>
                <input className="form-input" type="number" min="0" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} style={{ width: 80 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
