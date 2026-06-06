import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

const TYPES = ['flight','hotel','car','park','cruise','restaurant','show','transfer','other']
const TYPE_LABELS = { flight:'Vuelo ✈️', hotel:'Hotel 🏨', car:'Auto 🚗', park:'Parque 🎢', cruise:'Crucero 🚢', restaurant:'Restaurante 🍽️', show:'Show 🎭', transfer:'Traslado 🚌', other:'Otro 📌' }
const TYPE_ICON   = { flight:'✈️', hotel:'🏨', car:'🚗', park:'🎢', cruise:'🚢', restaurant:'🍽️', show:'🎭', transfer:'🚌', other:'📌' }

const EMPTY = { stage_id:'', date:'', time:'', type:'flight', title:'', airline:'', flight_number:'', pnr:'', confirmation:'', check_in:'', check_out:'', loc_name:'', loc_address:'', lat:'', lng:'', notes:'', family_id:'' }

export default function Eventos() {
  const { isSuper, familyId, stages, families } = useAdmin()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterStage, setFilterStage] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('events').select('*').order('date').order('time')
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    if (filterStage) q = q.eq('stage_id', filterStage)
    if (filterType)  q = q.eq('type', filterType)
    const { data } = await q
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId, filterStage, filterType])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setForm({ ...EMPTY, stage_id: stages[0]?.id || '', family_id: isSuper ? '' : familyId })
    setModal(true)
  }

  const save = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    const details = {}
    if (form.airline)       details.airline       = form.airline
    if (form.flight_number) details.flightNumber  = form.flight_number
    if (form.pnr)           details.pnr           = form.pnr
    if (form.confirmation)  details.confirmation  = form.confirmation
    if (form.check_in)      details.checkIn       = form.check_in
    if (form.check_out)     details.checkOut      = form.check_out
    if (form.notes)         details.notes         = form.notes

    const location = {}
    if (form.loc_name)    location.name    = form.loc_name
    if (form.loc_address) location.address = form.loc_address
    if (form.lat)         location.lat     = parseFloat(form.lat)
    if (form.lng)         location.lng     = parseFloat(form.lng)

    const payload = {
      stage_id: form.stage_id || null,
      date: form.date, time: form.time || null,
      type: form.type, title: form.title,
      details, location,
      people: [],
      family_id: form.family_id || null,
    }
    const { error } = await supabase.from('events').insert(payload)
    setSaving(false)
    if (!error) { setModal(false); fetch(); showToast('✅ Evento guardado') }
    else showToast('❌ Error al guardar')
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('events').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminado')
  }

  const STAGE_COLOR = { orlando:'#2563EB', crucero:'#7C3AED', miami:'#16A34A', ny:'#DC2626' }

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>📅 Eventos</h1>
          <p className="text-muted text-sm mt-4">Vuelos, hoteles, actividades y traslados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Agregar evento</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 'auto' }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">Todas las etapas</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <span className="badge badge-gray" style={{ alignSelf: 'center' }}>{events.length} eventos</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Etapa</th>
                {isSuper && <th>Familia</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td colSpan={isSuper ? 7 : 6} className="table-empty">Sin eventos. Agregá el primero.</td></tr>
              )}
              {events.map(ev => {
                const stage = stages.find(s => s.id === ev.stage_id)
                const color = STAGE_COLOR[ev.stage_id] || 'var(--accent)'
                return (
                  <tr key={ev.id}>
                    <td>{TYPE_ICON[ev.type] || '📌'} <span className="text-muted text-sm">{ev.type}</span></td>
                    <td className="fw-700">{ev.title}</td>
                    <td>{ev.date}</td>
                    <td className="text-muted">{ev.time || '—'}</td>
                    <td>
                      {stage && (
                        <span style={{ background: `${color}18`, color, padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          {stage.name}
                        </span>
                      )}
                    </td>
                    {isSuper && (
                      <td>
                        {ev.family_id
                          ? <span className="badge badge-blue">{ev.family_id}</span>
                          : <span className="badge badge-gray">Todos</span>
                        }
                      </td>
                    )}
                    <td>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(ev.id)}>🗑️</button>
                    </td>
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
              <div className="modal-title">📅 Nuevo evento</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Etapa</label>
                  <select className="form-select" value={form.stage_id} onChange={e => set('stage_id', e.target.value)}>
                    <option value="">Sin etapa</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Título *</label>
                <input className="form-input" placeholder="Ej: Vuelo ALC → MCO" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>

              {form.type === 'flight' && (
                <div className="form-grid form-grid-3" style={{ marginTop: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Aerolínea</label>
                    <input className="form-input" placeholder="American Airlines" value={form.airline} onChange={e => set('airline', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de vuelo</label>
                    <input className="form-input" placeholder="AA 990" value={form.flight_number} onChange={e => set('flight_number', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PNR / Localizador</label>
                    <input className="form-input" placeholder="K8R2L9" value={form.pnr} onChange={e => set('pnr', e.target.value)} style={{ fontFamily: 'monospace', fontSize: '1rem' }} />
                  </div>
                </div>
              )}
              {(form.type === 'hotel' || form.type === 'cruise') && (
                <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Confirmación</label>
                    <input className="form-input" placeholder="RC-228401" value={form.confirmation} onChange={e => set('confirmation', e.target.value)} style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-in</label>
                    <input className="form-input" type="date" value={form.check_in} onChange={e => set('check_in', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-out</label>
                    <input className="form-input" type="date" value={form.check_out} onChange={e => set('check_out', e.target.value)} />
                  </div>
                </div>
              )}

              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Lugar / Nombre</label>
                  <input className="form-input" placeholder="Orlando International Airport" value={form.loc_name} onChange={e => set('loc_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input className="form-input" value={form.loc_address} onChange={e => set('loc_address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Latitud</label>
                  <input className="form-input" type="number" step="0.0001" placeholder="28.4312" value={form.lat} onChange={e => set('lat', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitud</label>
                  <input className="form-input" type="number" step="0.0001" placeholder="-81.3081" value={form.lng} onChange={e => set('lng', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Notas adicionales</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>

              {isSuper && (
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Familia (vacío = compartido con todos)</label>
                  <select className="form-select" value={form.family_id} onChange={e => set('family_id', e.target.value)}>
                    <option value="">Compartido (todos)</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Guardando...' : '💾 Guardar evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
