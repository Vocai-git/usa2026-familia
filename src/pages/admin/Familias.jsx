import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

export default function Familias() {
  const { isSuper, families, reload } = useAdmin()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', access_code: '', emoji: '👨‍👩‍👧‍👦', color: '#2563EB' })
  const [saving, setSaving] = useState(false)

  if (!isSuper) return <div className="content"><div className="card" style={{ padding: 40, textAlign: 'center' }}><p>Acceso solo para super admin.</p></div></div>

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.id || !form.name || !form.access_code) return
    setSaving(true)
    const { error } = await supabase.from('families').upsert(form)
    setSaving(false)
    if (!error) { setModal(false); reload(); showToast('✅ Familia guardada') }
    else showToast('❌ Error: ' + error.message)
  }

  const del = async (id) => {
    if (!confirm(`¿Eliminar familia "${id}"? Esto no elimina sus eventos.`)) return
    await supabase.from('families').delete().eq('id', id)
    reload(); showToast('🗑️ Familia eliminada')
  }

  const editFamily = (f) => {
    setForm({ id: f.id, name: f.name, access_code: f.access_code, emoji: f.emoji, color: f.color || '#2563EB' })
    setModal(true)
  }

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>👨‍👩‍👧‍👦 Familias</h1>
          <p className="text-muted text-sm mt-4">Gestión de accesos y grupos familiares</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ id: '', name: '', access_code: '', emoji: '👨‍👩‍👧‍👦', color: '#2563EB' }); setModal(true) }}>
          + Nueva familia
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {families.map(f => (
          <div key={f.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: f.color + '20', border: `2px solid ${f.color}40`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {f.emoji}
              </div>
              <div>
                <div className="fw-800">{f.name}</div>
                <div className="text-xs text-muted">ID: {f.id}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 3 }}>Código de acceso</div>
              <code style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>
                {f.access_code}
              </code>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => editFamily(f)}>✏️ Editar</button>
              <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(f.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, padding: '16px 20px' }}>
        <div className="fw-700" style={{ marginBottom: 8 }}>🔑 Cómo compartir accesos</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
          1. Mandá el link de la app a cada familia: <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>vocai-git.github.io/usa2026-familia/</code><br />
          2. Cada familia elige su nombre y pone el código de arriba.<br />
          3. Para el panel de gestión: <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>vocai-git.github.io/usa2026-familia/admin</code>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">👨‍👩‍👧‍👦 {form.id ? 'Editar familia' : 'Nueva familia'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">ID (sin espacios) *</label>
                  <input className="form-input mono" placeholder="moledo" value={form.id} onChange={e => set('id', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" placeholder="Familia Moledo" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Código de acceso *</label>
                  <input className="form-input mono" placeholder="moledo2026" value={form.access_code} onChange={e => set('access_code', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emoji</label>
                  <input className="form-input" placeholder="🦋" value={form.emoji} onChange={e => set('emoji', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Color (hex)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  <input className="form-input mono" value={form.color} onChange={e => set('color', e.target.value)} style={{ flex: 1 }} />
                </div>
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
