import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

const CATS = ['hotel','airport','park','cruise_port','restaurant','rental','hospital','other']
const CAT_LABEL = { hotel:'Hotel', airport:'Aeropuerto', park:'Parque', cruise_port:'Puerto crucero', restaurant:'Restaurante', rental:'Rent-a-car', hospital:'Hospital', other:'Otro' }
const CAT_ICON  = { hotel:'🏨', airport:'✈️', park:'🎢', cruise_port:'🚢', restaurant:'🍽️', rental:'🚗', hospital:'🏥', other:'📌' }

export default function Mapa() {
  const { isSuper, familyId, families } = useAdmin()
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'hotel', lat: '', lng: '', address: '', family_id: '' })

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('map_pins').select('*').order('name')
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    const { data } = await q
    setPins(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.lat || !form.lng) return
    await supabase.from('map_pins').insert({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), family_id: form.family_id || null })
    setModal(false)
    setForm({ name: '', category: 'hotel', lat: '', lng: '', address: '', family_id: '' })
    fetch(); showToast('✅ Pin guardado')
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('map_pins').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminado')
  }

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>🗺 Pines del mapa</h1>
          <p className="text-muted text-sm mt-4">Hoteles, aeropuertos, parques y más</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', category: 'hotel', lat: '', lng: '', address: '', family_id: isSuper ? '' : familyId }); setModal(true) }}>
          + Agregar pin
        </button>
      </div>

      <div className="card" style={{ marginBottom: 12, padding: '12px 16px' }}>
        <div className="text-sm text-muted">
          💡 <strong>Cómo obtener coordenadas:</strong> Google Maps → clic derecho sobre el punto → aparecen las coordenadas. Copiá lat y lng.
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Coordenadas</th>
                {isSuper && <th>Familia</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pins.length === 0 && <tr><td colSpan={isSuper ? 6 : 5} className="table-empty">Sin pines. Agregá el primero.</td></tr>}
              {pins.map(p => (
                <tr key={p.id}>
                  <td>{CAT_ICON[p.category]} <span className="text-muted text-sm">{CAT_LABEL[p.category]}</span></td>
                  <td className="fw-700">{p.name}</td>
                  <td className="text-muted text-sm">{p.address || '—'}</td>
                  <td className="mono text-sm text-muted">{p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</td>
                  {isSuper && <td>{p.family_id ? <span className="badge badge-blue">{p.family_id}</span> : <span className="badge badge-gray">Todos</span>}</td>}
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">🗺</a>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(p.id)}>🗑️</button>
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
              <div className="modal-title">🗺 Nuevo pin</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" placeholder="Hotel Rosen Inn" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATS.map(c => <option key={c} value={c}>{CAT_ICON[c]} {CAT_LABEL[c]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Dirección</label>
                <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Latitud *</label>
                  <input className="form-input mono" type="number" step="0.0001" placeholder="28.5383" value={form.lat} onChange={e => set('lat', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitud *</label>
                  <input className="form-input mono" type="number" step="0.0001" placeholder="-81.3792" value={form.lng} onChange={e => set('lng', e.target.value)} />
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
