import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'usa2026admin'

const EVENT_TYPES = ['flight', 'hotel', 'car', 'park', 'cruise', 'restaurant', 'show', 'transfer', 'other']
const EVENT_TYPE_LABELS = { flight: 'Vuelo ✈️', hotel: 'Hotel 🏨', car: 'Auto 🚗', park: 'Parque 🎢', cruise: 'Crucero 🚢', restaurant: 'Restaurante 🍽️', show: 'Show 🎭', transfer: 'Traslado 🚌', other: 'Otro 📌' }
const DOC_TYPES = ['passport', 'esta', 'insurance', 'voucher', 'ticket', 'boarding_pass', 'license', 'other']
const DOC_TYPE_LABELS = { passport: 'Pasaporte 🛂', esta: 'ESTA 🇺🇸', insurance: 'Seguro 🏥', voucher: 'Voucher 🎫', ticket: 'Entrada 🎟️', boarding_pass: 'Boarding Pass ✈️', license: 'Licencia 🚗', other: 'Otro 📄' }

function AdminLogin({ onLogin }) {
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)
  const submit = () => {
    if (pass === ADMIN_PASS) { onLogin(); localStorage.setItem('admin_auth', '1') }
    else setErr(true)
  }
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
      <div className="card" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 8 }}>⚙️</div>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Panel Admin</h2>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            className="form-input"
            type="password"
            placeholder="Contraseña admin"
            value={pass}
            onChange={e => { setPass(e.target.value); setErr(false) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          {err && <div className="text-sm" style={{ color: 'var(--red)', marginTop: 4 }}>Contraseña incorrecta</div>}
        </div>
        <button className="btn btn-primary btn-block" onClick={submit}>Entrar</button>
      </div>
    </div>
  )
}

// ── Event Form ──
function EventForm({ stages, people, onSave, onCancel, initial }) {
  const GROUPS = ['todos', 'nucleo', 'crucero', 'hermanos', 'papa_andrea']
  const [form, setForm] = useState(initial || {
    stage_id: stages[0]?.id || '',
    date: '',
    time: '',
    type: 'flight',
    title: '',
    details: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
    location_address: '',
    people_ids: ['todos'],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const togglePerson = (id) => {
    const curr = form.people_ids || []
    set('people_ids', curr.includes(id) ? curr.filter(p => p !== id) : [...curr, id])
  }

  const submit = async () => {
    let details = {}
    try { details = JSON.parse(form.details || '{}') } catch { details = { notes: form.details } }
    const location = {}
    if (form.location_name) location.name = form.location_name
    if (form.location_lat) location.lat = parseFloat(form.location_lat)
    if (form.location_lng) location.lng = parseFloat(form.location_lng)
    if (form.location_address) location.address = form.location_address

    const payload = {
      stage_id: form.stage_id,
      date: form.date,
      time: form.time || null,
      type: form.type,
      title: form.title,
      details,
      location,
      people: form.people_ids,
    }

    if (initial?.id) {
      await supabase.from('events').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('events').insert(payload)
    }
    onSave()
  }

  const allPeople = [
    ...GROUPS.map(g => ({ id: g, name: g.charAt(0).toUpperCase() + g.slice(1), isGroup: true })),
    ...people.map(p => ({ ...p, isGroup: false }))
  ]

  return (
    <div className="modal-sheet" style={{ position: 'relative', maxHeight: 'none', overflowY: 'visible', padding: 0 }}>
      <div className="form-group">
        <label className="form-label">Etapa</label>
        <select className="form-select" value={form.stage_id} onChange={e => set('stage_id', e.target.value)}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Hora</label>
          <input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Tipo</label>
        <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" placeholder="Ej: Vuelo AEI → MCO" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Detalles (JSON o texto libre)</label>
        <textarea className="form-input" rows={3} placeholder={'{"airline":"AA","flightNumber":"AA990","pnr":"K8R2L9"}'} value={form.details} onChange={e => set('details', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Lugar</label>
          <input className="form-input" placeholder="Nombre del lugar" value={form.location_name} onChange={e => set('location_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input className="form-input" placeholder="Dirección" value={form.location_address} onChange={e => set('location_address', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Latitud</label>
          <input className="form-input" type="number" placeholder="28.5383" value={form.location_lat} onChange={e => set('location_lat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Longitud</label>
          <input className="form-input" type="number" placeholder="-81.3792" value={form.location_lng} onChange={e => set('location_lng', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Para quiénes</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allPeople.map(p => (
            <button
              key={p.id}
              className={`profile-pill${form.people_ids?.includes(p.id) ? ' active' : ''}`}
              onClick={() => togglePerson(p.id)}
              style={{ fontStyle: p.isGroup ? 'italic' : 'normal' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>💾 Guardar</button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Document Upload ──
function DocUpload({ people, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', type: 'passport', owner_id: '', notes: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name) return
    setUploading(true)
    let storage_path = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${form.type}/${form.owner_id || 'grupo'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file)
      if (!error) storage_path = path
    }
    await supabase.from('documents').insert({ ...form, storage_path })
    setUploading(false)
    onSave()
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Nombre del documento *</label>
        <input className="form-input" placeholder="Ej: Pasaporte Agustín" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Persona</label>
          <select className="form-select" value={form.owner_id} onChange={e => set('owner_id', e.target.value)}>
            <option value="">Grupo (todos)</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notas</label>
        <input className="form-input" placeholder="Opcional" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Archivo (foto, PDF)</label>
        <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={uploading}>
          {uploading ? '⏳ Subiendo...' : '⬆️ Subir documento'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Code Form ──
function CodeForm({ people, onSave, onCancel }) {
  const [form, setForm] = useState({ label: '', code: '', sub_info: '', people: ['todos'] })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.label || !form.code) return
    await supabase.from('codes').insert(form)
    onSave()
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Etiqueta *</label>
        <input className="form-input" placeholder="Ej: PNR Vuelo AA990" value={form.label} onChange={e => set('label', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Código *</label>
        <input className="form-input" placeholder="Ej: K8R2L9" value={form.code} onChange={e => set('code', e.target.value)} style={{ fontFamily: 'monospace', fontSize: '1.1rem' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Info adicional</label>
        <input className="form-input" placeholder="Ej: American Airlines, 10 jun" value={form.sub_info} onChange={e => set('sub_info', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>💾 Guardar</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Alarm Form ──
function AlarmForm({ events, people, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', trigger_at: '', linked_event: '', action_label: '', action_url: '', people: ['todos'] })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.trigger_at) return
    const action = form.action_label ? { label: form.action_label, url: form.action_url, type: 'url' } : {}
    await supabase.from('alarms').insert({
      title: form.title,
      trigger_at: form.trigger_at,
      linked_event: form.linked_event || null,
      action,
      people: form.people,
      is_active: true,
    })
    onSave()
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" placeholder="Ej: Check-in vuelo AA990" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Cuándo *</label>
        <input className="form-input" type="datetime-local" value={form.trigger_at} onChange={e => set('trigger_at', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Botón de acción (label)</label>
        <input className="form-input" placeholder="Ej: Hacer check-in" value={form.action_label} onChange={e => set('action_label', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">URL de acción</label>
        <input className="form-input" type="url" placeholder="https://..." value={form.action_url} onChange={e => set('action_url', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>💾 Guardar</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Pin Form ──
function PinForm({ people, onSave, onCancel }) {
  const PIN_CATS = ['hotel', 'airport', 'park', 'cruise_port', 'restaurant', 'rental', 'hospital', 'other']
  const [form, setForm] = useState({ name: '', category: 'hotel', lat: '', lng: '', address: '', people: ['todos'] })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.lat || !form.lng) return
    await supabase.from('map_pins').insert({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) })
    onSave()
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Nombre *</label>
        <input className="form-input" placeholder="Ej: Hotel Rosen Inn" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Categoría</label>
        <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
          {PIN_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Latitud *</label>
          <input className="form-input" type="number" step="0.0001" value={form.lat} onChange={e => set('lat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Longitud *</label>
          <input className="form-input" type="number" step="0.0001" value={form.lng} onChange={e => set('lng', e.target.value)} />
        </div>
      </div>
      <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
        💡 Buscá en Google Maps, click derecho → "¿Qué hay aquí?" para copiar lat/lng
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>💾 Guardar</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Checklist Form ──
function ChecklistForm({ stages, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [stageId, setStageId] = useState('')
  const [items, setItems] = useState([''])

  const addItem = () => setItems(i => [...i, ''])
  const setItem = (idx, val) => setItems(i => i.map((it, j) => j === idx ? val : it))
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))

  const submit = async () => {
    if (!title) return
    const { data: cl } = await supabase.from('checklists').insert({ title, stage_id: stageId || null, people: ['todos'] }).select().single()
    if (cl) {
      const itemsToInsert = items.filter(i => i.trim()).map((text, sort_order) => ({ checklist_id: cl.id, text, sort_order }))
      if (itemsToInsert.length) await supabase.from('checklist_items').insert(itemsToInsert)
    }
    onSave()
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Antes de salir de Alicante" />
      </div>
      <div className="form-group">
        <label className="form-label">Etapa (opcional)</label>
        <select className="form-select" value={stageId} onChange={e => setStageId(e.target.value)}>
          <option value="">Sin etapa</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Items</label>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="form-input" placeholder={`Item ${idx + 1}`} value={item} onChange={e => setItem(idx, e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={() => removeItem(idx)}>✕</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Agregar item</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>💾 Guardar</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Main Admin ──
export default function Admin() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('admin_auth') === '1')
  const [people, setPeople] = useState([])
  const [stages, setStages] = useState([])
  const [events, setEvents] = useState([])
  const [docs, setDocs] = useState([])
  const [codes, setCodes] = useState([])
  const [alarms, setAlarms] = useState([])
  const [pins, setPins] = useState([])
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'event' | 'doc' | 'code' | 'alarm' | 'pin' | 'checklist'
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const reload = async () => {
    setLoading(true)
    const [{ data: p }, { data: s }, { data: e }, { data: d }, { data: c }, { data: a }, { data: pins }, { data: cl }] = await Promise.all([
      supabase.from('people').select('*').order('sort_order'),
      supabase.from('stages').select('*').order('sort_order'),
      supabase.from('events').select('*').order('date'),
      supabase.from('documents').select('*').order('created_at'),
      supabase.from('codes').select('*').order('label'),
      supabase.from('alarms').select('*').order('trigger_at'),
      supabase.from('map_pins').select('*'),
      supabase.from('checklists').select('*'),
    ])
    setPeople(p || [])
    setStages(s || [])
    setEvents(e || [])
    setDocs(d || [])
    setCodes(c || [])
    setAlarms(a || [])
    setPins(pins || [])
    setChecklists(cl || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) reload() }, [authed])

  const deleteItem = async (table, id) => {
    if (!confirm('¿Eliminar?')) return
    await supabase.from(table).delete().eq('id', id)
    reload()
    showToast('🗑️ Eliminado')
  }

  const onSaved = () => { setModal(null); reload(); showToast('✅ Guardado') }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />
  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando admin...</span></div>

  const sections = [
    {
      id: 'events', title: '📅 Eventos', count: events.length, modal: 'event',
      items: events.map(e => ({ id: e.id, name: `${e.title} · ${e.date}` })),
      table: 'events'
    },
    {
      id: 'docs', title: '📄 Documentos', count: docs.length, modal: 'doc',
      items: docs.map(d => ({ id: d.id, name: d.name })),
      table: 'documents'
    },
    {
      id: 'codes', title: '🔑 Códigos', count: codes.length, modal: 'code',
      items: codes.map(c => ({ id: c.id, name: `${c.label}: ${c.code}` })),
      table: 'codes'
    },
    {
      id: 'alarms', title: '🔔 Alarmas', count: alarms.length, modal: 'alarm',
      items: alarms.map(a => ({ id: a.id, name: a.title })),
      table: 'alarms'
    },
    {
      id: 'pins', title: '🗺 Pines del mapa', count: pins.length, modal: 'pin',
      items: pins.map(p => ({ id: p.id, name: p.name })),
      table: 'map_pins'
    },
    {
      id: 'checklists', title: '✅ Checklists', count: checklists.length, modal: 'checklist',
      items: checklists.map(c => ({ id: c.id, name: c.title })),
      table: 'checklists'
    },
  ]

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="page-title" style={{ margin: 0 }}>⚙️ Panel Admin</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => { localStorage.removeItem('admin_auth'); setAuthed(false) }}>
          Salir
        </button>
      </div>

      {sections.map(section => (
        <div key={section.id} className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ margin: 0 }}>{section.title} ({section.count})</div>
            <button className="btn btn-primary btn-sm" onClick={() => setModal(section.modal)}>+ Agregar</button>
          </div>
          <div className="card" style={{ marginTop: 10, padding: '0 16px' }}>
            {section.items.length === 0 && (
              <div className="text-muted text-sm" style={{ padding: '12px 0' }}>Sin entradas todavía</div>
            )}
            {section.items.map(item => (
              <div key={item.id} className="admin-item">
                <span className="admin-item-name text-sm">{item.name}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => deleteItem(section.table, item.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modals */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">
              {modal === 'event' ? '📅 Nuevo evento' :
               modal === 'doc' ? '📄 Subir documento' :
               modal === 'code' ? '🔑 Nuevo código' :
               modal === 'alarm' ? '🔔 Nueva alarma' :
               modal === 'pin' ? '🗺 Nuevo pin' :
               '✅ Nueva checklist'}
            </div>
            {modal === 'event' && <EventForm stages={stages} people={people} onSave={onSaved} onCancel={() => setModal(null)} />}
            {modal === 'doc' && <DocUpload people={people} onSave={onSaved} onCancel={() => setModal(null)} />}
            {modal === 'code' && <CodeForm people={people} onSave={onSaved} onCancel={() => setModal(null)} />}
            {modal === 'alarm' && <AlarmForm events={events} people={people} onSave={onSaved} onCancel={() => setModal(null)} />}
            {modal === 'pin' && <PinForm people={people} onSave={onSaved} onCancel={() => setModal(null)} />}
            {modal === 'checklist' && <ChecklistForm stages={stages} onSave={onSaved} onCancel={() => setModal(null)} />}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
