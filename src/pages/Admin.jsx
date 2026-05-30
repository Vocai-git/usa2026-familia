import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const EVENT_TYPES = ['flight','hotel','car','park','cruise','restaurant','show','transfer','other']
const TYPE_LABELS = { flight:'Vuelo ✈️', hotel:'Hotel 🏨', car:'Auto 🚗', park:'Parque 🎢', cruise:'Crucero 🚢', restaurant:'Restaurante 🍽️', show:'Show 🎭', transfer:'Traslado 🚌', other:'Otro 📌' }
const DOC_TYPES   = ['passport','esta','insurance','voucher','ticket','boarding_pass','license','other']
const DOC_LABELS  = { passport:'Pasaporte 🛂', esta:'ESTA 🇺🇸', insurance:'Seguro 🏥', voucher:'Voucher 🎫', ticket:'Entrada 🎟️', boarding_pass:'Boarding Pass ✈️', license:'Licencia 🚗', other:'Otro 📄' }

export default function Admin() {
  const { isAdmin, families, stages, reload } = useApp()
  const [tab, setTab] = useState('events')
  const [data, setData] = useState({ events: [], documents: [], codes: [], alarms: [], map_pins: [], checklists: [] })
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  if (!isAdmin) return null

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const fetchAll = async () => {
    setLoading(true)
    const [e, d, c, a, p, cl] = await Promise.all([
      supabase.from('events').select('*').order('date'),
      supabase.from('documents').select('*').order('created_at'),
      supabase.from('codes').select('*').order('label'),
      supabase.from('alarms').select('*').order('trigger_at'),
      supabase.from('map_pins').select('*'),
      supabase.from('checklists').select('*'),
    ])
    setData({ events: e.data||[], documents: d.data||[], codes: c.data||[], alarms: a.data||[], map_pins: p.data||[], checklists: cl.data||[] })
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const del = async (table, id) => {
    if (!confirm('¿Eliminar?')) return
    await supabase.from(table).delete().eq('id', id)
    fetchAll(); reload(); showToast('🗑️ Eliminado')
  }

  const saved = () => { setModal(null); fetchAll(); reload(); showToast('✅ Guardado') }

  const TABS = [
    { id: 'events',    label: 'Eventos',    count: data.events.length },
    { id: 'documents', label: 'Docs',       count: data.documents.length },
    { id: 'codes',     label: 'Códigos',    count: data.codes.length },
    { id: 'alarms',    label: 'Alarmas',    count: data.alarms.length },
    { id: 'map_pins',  label: 'Mapa',       count: data.map_pins.length },
    { id: 'checklists',label: 'Listas',     count: data.checklists.length },
  ]

  const TABLE_MAP = { events: 'events', documents: 'documents', codes: 'codes', alarms: 'alarms', map_pins: 'map_pins', checklists: 'checklists' }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="page-title" style={{ margin: 0 }}>⚙️ Admin</h2>
        <span className="badge badge-blue">super admin</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 2, scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, padding: '6px 12px',
              borderRadius: 'var(--r-full)',
              fontSize: '0.78rem', fontWeight: 700,
              background: tab === t.id ? 'var(--accent)' : 'var(--surface)',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              border: tab === t.id ? 'none' : '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {t.label} <span style={{ opacity: 0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Add button */}
      <button
        className="btn btn-primary btn-block"
        style={{ marginBottom: 16 }}
        onClick={() => setModal(tab)}
      >
        + Agregar {TABS.find(t => t.id === tab)?.label}
      </button>

      {/* List */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: '0 16px' }}>
          {data[tab]?.length === 0 && (
            <div className="text-sm text-muted" style={{ padding: '16px 0', textAlign: 'center' }}>
              Sin entradas. Agregá la primera.
            </div>
          )}
          {data[tab]?.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title || item.name || item.label || item.label || '—'}
                {item.date && <span className="text-xs text-muted" style={{ marginLeft: 6 }}>{item.date}</span>}
                {item.family_id && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{item.family_id}</span>}
              </div>
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => del(TABLE_MAP[tab], item.id)}
              >🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Familia codes */}
      <div className="section-label" style={{ marginTop: 24 }}>🔑 Códigos de acceso familiar</div>
      <div className="card" style={{ padding: '0 16px' }}>
        {families.map(f => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.2rem' }}>{f.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="fw-700 text-sm">{f.name}</div>
              <div className="text-xs text-muted">Código: <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{f.access_code}</code></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              {modal === 'events' ? '📅 Nuevo evento' :
               modal === 'documents' ? '📄 Nuevo documento' :
               modal === 'codes' ? '🔑 Nuevo código' :
               modal === 'alarms' ? '🔔 Nueva alarma' :
               modal === 'map_pins' ? '🗺 Nuevo pin' : '✅ Nueva checklist'}
            </div>
            {modal === 'events'    && <EventForm    stages={stages} families={families} onSave={saved} onCancel={() => setModal(null)} />}
            {modal === 'documents' && <DocForm      families={families} onSave={saved} onCancel={() => setModal(null)} />}
            {modal === 'codes'     && <CodeForm     families={families} onSave={saved} onCancel={() => setModal(null)} />}
            {modal === 'alarms'    && <AlarmForm    families={families} onSave={saved} onCancel={() => setModal(null)} />}
            {modal === 'map_pins'  && <PinForm      families={families} onSave={saved} onCancel={() => setModal(null)} />}
            {modal === 'checklists'&& <ChecklistForm stages={stages} families={families} onSave={saved} onCancel={() => setModal(null)} />}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ─── Formularios ───────────────────────────────────────────────────────────────

function FamilyField({ value, onChange, families }) {
  return (
    <div className="form-group">
      <label className="form-label">Familia (vacío = compartido con todos)</label>
      <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Compartido (todos)</option>
        {families.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
      </select>
    </div>
  )
}

function SaveCancel({ onSave, onCancel, label = 'Guardar' }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button className="btn btn-primary" style={{ flex: 1 }} onClick={onSave}>💾 {label}</button>
      <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
    </div>
  )
}

function EventForm({ stages, families, onSave, onCancel }) {
  const [f, setF] = useState({ stage_id: stages[0]?.id||'', date:'', time:'', type:'flight', title:'', details:'', loc_name:'', loc_address:'', lat:'', lng:'', family_id:'' })
  const s = (k,v) => setF(p => ({...p,[k]:v}))
  const submit = async () => {
    if (!f.title || !f.date) return
    let details = {}
    try { details = JSON.parse(f.details||'{}') } catch { details = { notes: f.details } }
    const location = {}
    if (f.loc_name) location.name = f.loc_name
    if (f.lat) location.lat = parseFloat(f.lat)
    if (f.lng) location.lng = parseFloat(f.lng)
    if (f.loc_address) location.address = f.loc_address
    await supabase.from('events').insert({ stage_id: f.stage_id, date: f.date, time: f.time||null, type: f.type, title: f.title, details, location, people: [], family_id: f.family_id||null })
    onSave()
  }
  return (
    <div>
      <FamilyField value={f.family_id} onChange={v => s('family_id',v)} families={families} />
      <div className="form-group">
        <label className="form-label">Etapa</label>
        <select className="form-select" value={f.stage_id} onChange={e => s('stage_id',e.target.value)}>
          {stages.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input className="form-input" type="date" value={f.date} onChange={e => s('date',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Hora</label>
          <input className="form-input" type="time" value={f.time} onChange={e => s('time',e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Tipo</label>
        <select className="form-select" value={f.type} onChange={e => s('type',e.target.value)}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" placeholder="Ej: Vuelo ALC → MCO" value={f.title} onChange={e => s('title',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Detalles (JSON o texto)</label>
        <textarea className="form-input" rows={2} placeholder='{"airline":"AA","flightNumber":"AA990","pnr":"K8R2L9"}' value={f.details} onChange={e => s('details',e.target.value)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Lugar</label>
          <input className="form-input" placeholder="Nombre" value={f.loc_name} onChange={e => s('loc_name',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input className="form-input" value={f.loc_address} onChange={e => s('loc_address',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Latitud</label>
          <input className="form-input" type="number" value={f.lat} onChange={e => s('lat',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Longitud</label>
          <input className="form-input" type="number" value={f.lng} onChange={e => s('lng',e.target.value)} />
        </div>
      </div>
      <SaveCancel onSave={submit} onCancel={onCancel} />
    </div>
  )
}

function DocForm({ families, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', type:'passport', owner_id:'', notes:'', family_id:'' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const s = (k,v) => setF(p => ({...p,[k]:v}))
  const submit = async () => {
    if (!f.name) return
    setUploading(true)
    let storage_path = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${f.type}/${f.owner_id||'grupo'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file)
      if (!error) storage_path = path
    }
    await supabase.from('documents').insert({ ...f, storage_path, family_id: f.family_id||null })
    setUploading(false); onSave()
  }
  return (
    <div>
      <FamilyField value={f.family_id} onChange={v => s('family_id',v)} families={families} />
      <div className="form-group">
        <label className="form-label">Nombre *</label>
        <input className="form-input" placeholder="Ej: Pasaporte Agustín" value={f.name} onChange={e => s('name',e.target.value)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={f.type} onChange={e => s('type',e.target.value)}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Titular</label>
          <input className="form-input" placeholder="nombre" value={f.owner_id} onChange={e => s('owner_id',e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Archivo</label>
        <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ width:'100%' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Notas</label>
        <input className="form-input" value={f.notes} onChange={e => s('notes',e.target.value)} />
      </div>
      <SaveCancel onSave={submit} onCancel={onCancel} label={uploading ? 'Subiendo...' : 'Subir'} />
    </div>
  )
}

function CodeForm({ families, onSave, onCancel }) {
  const [f, setF] = useState({ label:'', code:'', sub_info:'', family_id:'' })
  const s = (k,v) => setF(p => ({...p,[k]:v}))
  const submit = async () => {
    if (!f.label || !f.code) return
    await supabase.from('codes').insert({ ...f, family_id: f.family_id||null })
    onSave()
  }
  return (
    <div>
      <FamilyField value={f.family_id} onChange={v => s('family_id',v)} families={families} />
      <div className="form-group">
        <label className="form-label">Etiqueta *</label>
        <input className="form-input" placeholder="Ej: PNR vuelo AA990" value={f.label} onChange={e => s('label',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Código *</label>
        <input className="form-input" style={{ fontFamily:'monospace', fontSize:'1.1rem' }} placeholder="K8R2L9" value={f.code} onChange={e => s('code',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Info adicional</label>
        <input className="form-input" value={f.sub_info} onChange={e => s('sub_info',e.target.value)} />
      </div>
      <SaveCancel onSave={submit} onCancel={onCancel} />
    </div>
  )
}

function AlarmForm({ families, onSave, onCancel }) {
  const [f, setF] = useState({ title:'', trigger_at:'', action_label:'', action_url:'', family_id:'' })
  const s = (k,v) => setF(p => ({...p,[k]:v}))
  const submit = async () => {
    if (!f.title || !f.trigger_at) return
    const action = f.action_label ? { type:'url', label:f.action_label, url:f.action_url } : {}
    await supabase.from('alarms').insert({ title:f.title, trigger_at:f.trigger_at, action, people:[], is_active:true, family_id:f.family_id||null })
    onSave()
  }
  return (
    <div>
      <FamilyField value={f.family_id} onChange={v => s('family_id',v)} families={families} />
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" value={f.title} onChange={e => s('title',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Fecha y hora *</label>
        <input className="form-input" type="datetime-local" value={f.trigger_at} onChange={e => s('trigger_at',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Botón (texto)</label>
        <input className="form-input" placeholder="Hacer check-in" value={f.action_label} onChange={e => s('action_label',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">URL de acción</label>
        <input className="form-input" type="url" value={f.action_url} onChange={e => s('action_url',e.target.value)} />
      </div>
      <SaveCancel onSave={submit} onCancel={onCancel} />
    </div>
  )
}

function PinForm({ families, onSave, onCancel }) {
  const CATS = ['hotel','airport','park','cruise_port','restaurant','rental','hospital','other']
  const [f, setF] = useState({ name:'', category:'hotel', lat:'', lng:'', address:'', family_id:'' })
  const s = (k,v) => setF(p => ({...p,[k]:v}))
  const submit = async () => {
    if (!f.name || !f.lat || !f.lng) return
    await supabase.from('map_pins').insert({ ...f, lat:parseFloat(f.lat), lng:parseFloat(f.lng), family_id:f.family_id||null })
    onSave()
  }
  return (
    <div>
      <FamilyField value={f.family_id} onChange={v => s('family_id',v)} families={families} />
      <div className="form-group">
        <label className="form-label">Nombre *</label>
        <input className="form-input" value={f.name} onChange={e => s('name',e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Categoría</label>
        <select className="form-select" value={f.category} onChange={e => s('category',e.target.value)}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input className="form-input" value={f.address} onChange={e => s('address',e.target.value)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Latitud *</label>
          <input className="form-input" type="number" step="0.0001" value={f.lat} onChange={e => s('lat',e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Longitud *</label>
          <input className="form-input" type="number" step="0.0001" value={f.lng} onChange={e => s('lng',e.target.value)} />
        </div>
      </div>
      <div className="text-xs text-muted" style={{ marginBottom:12 }}>💡 Google Maps → clic derecho → "¿Qué hay aquí?" para copiar coordenadas</div>
      <SaveCancel onSave={submit} onCancel={onCancel} />
    </div>
  )
}

function ChecklistForm({ stages, families, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [stageId, setStageId] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [items, setItems] = useState([''])
  const addItem = () => setItems(i => [...i,''])
  const setItem = (idx,v) => setItems(i => i.map((it,j) => j===idx?v:it))
  const removeItem = idx => setItems(i => i.filter((_,j) => j!==idx))
  const submit = async () => {
    if (!title) return
    const { data: cl } = await supabase.from('checklists').insert({ title, stage_id:stageId||null, people:[], family_id:familyId||null }).select().single()
    if (cl) {
      const its = items.filter(i=>i.trim()).map((text,sort_order)=>({checklist_id:cl.id,text,sort_order}))
      if (its.length) await supabase.from('checklist_items').insert(its)
    }
    onSave()
  }
  return (
    <div>
      <FamilyField value={familyId} onChange={setFamilyId} families={families} />
      <div className="form-group">
        <label className="form-label">Título *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Antes de salir de Alicante" />
      </div>
      <div className="form-group">
        <label className="form-label">Etapa</label>
        <select className="form-select" value={stageId} onChange={e => setStageId(e.target.value)}>
          <option value="">Sin etapa</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Items</label>
        {items.map((item,idx) => (
          <div key={idx} style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input className="form-input" placeholder={`Item ${idx+1}`} value={item} onChange={e => setItem(idx,e.target.value)} />
            {items.length > 1 && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => removeItem(idx)}>✕</button>}
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Item</button>
      </div>
      <SaveCancel onSave={submit} onCancel={onCancel} />
    </div>
  )
}
