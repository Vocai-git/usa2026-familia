import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const DOC_TYPES = {
  passport:     { label: 'Pasaporte',     icon: '🛂' },
  esta:         { label: 'ESTA',          icon: '🇺🇸' },
  insurance:    { label: 'Seguro de viaje', icon: '🏥' },
  voucher:      { label: 'Voucher',       icon: '🎫' },
  ticket:       { label: 'Entrada',       icon: '🎟️' },
  boarding_pass:{ label: 'Boarding pass', icon: '✈️' },
  license:      { label: 'Licencia',      icon: '🚗' },
  other:        { label: 'Otro',          icon: '📄' },
}

const EMPTY_FORM = { name: '', type: 'passport', owner_id: '', notes: '' }

function DocCard({ doc, onView }) {
  const { people } = useApp()
  const type = DOC_TYPES[doc.type] || DOC_TYPES.other
  const owner = people.find(p => p.id === doc.owner_id)
  const isQr = ['boarding_pass', 'ticket', 'voucher', 'esta'].includes(doc.type)

  return (
    <div className="doc-card" style={isQr ? { borderLeft: '3px solid var(--accent)' } : {}}>
      <span className="doc-icon">{type.icon}</span>
      <div style={{ flex: 1 }}>
        <div className="doc-name">{doc.name}</div>
        <div className="doc-type">{type.label}{owner ? ` · ${owner.name}` : ''}</div>
        {doc.notes && <div className="text-sm text-muted" style={{ marginTop: 4 }}>{doc.notes}</div>}
      </div>
      {doc.storage_path && (
        isQr ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onView(doc, true)}
            style={{ fontSize: '0.72rem', padding: '5px 10px', background: '#18181B' }}
          >
            📲 QR
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onView(doc, false)}
            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
          >
            ⬇️ Ver
          </button>
        )
      )}
    </div>
  )
}

function CodesSection({ codes, onCopy }) {
  const [search, setSearch] = useState('')
  const filtered = codes.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <input
        className="form-input"
        placeholder="🔍 Buscar código o reserva..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      {filtered.length === 0 && (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <p>Sin resultados</p>
        </div>
      )}
      {filtered.map(c => (
        <div key={c.id} className="code-card" onClick={() => onCopy(c.code, c.label)}>
          <div>
            <div className="code-label">{c.label}</div>
            <div className="code-value">{c.code}</div>
            {c.sub_info && <div className="code-sub">{c.sub_info}</div>}
          </div>
          <span className="code-copy" title="Copiar">📋</span>
        </div>
      ))}
    </div>
  )
}

function UploadModal({ family, people, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !file) { setError('Completá el nombre y seleccioná un archivo.'); return }
    setError(null)
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${form.type}/${family.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
    if (uploadErr) { setError('Error al subir el archivo. Intentá de nuevo.'); setUploading(false); return }
    const { error: insertErr } = await supabase.from('documents').insert({
      name: form.name,
      type: form.type,
      owner_id: form.owner_id || null,
      notes: form.notes || null,
      storage_path: path,
      family_id: family.id,
    })
    setUploading(false)
    if (insertErr) { setError('Error al guardar el documento.'); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">📤 Subir documento</div>

        <div style={{ marginTop: 16 }}>
          <label className="form-label">Nombre del documento *</label>
          <input
            className="form-input"
            placeholder="Ej: Pasaporte Agustín"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={{ marginTop: 6 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div>
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              style={{ marginTop: 6 }}
            >
              {Object.entries(DOC_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">¿De quién?</label>
            <select
              className="form-select"
              value={form.owner_id}
              onChange={e => set('owner_id', e.target.value)}
              style={{ marginTop: 6 }}
            >
              <option value="">Grupo</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="form-label">Archivo (foto o PDF) *</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files[0])}
            style={{ width: '100%', marginTop: 6, fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="form-label">Notas (opcional)</label>
          <input
            className="form-input"
            placeholder="Ej: Vence 2031"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ marginTop: 6 }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 12, color: 'var(--red)', fontSize: '0.82rem' }}>⚠️ {error}</div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          onClick={save}
          disabled={uploading}
        >
          {uploading ? '⏳ Subiendo...' : '⬆️ Subir documento'}
        </button>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function Documentos() {
  const { family, filtrarPorPerfil, people, loading: appLoading } = useApp()
  const [docs, setDocs] = useState([])
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('docs')
  const [viewDoc, setViewDoc] = useState(null)
  const [qrMode, setQrMode] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  const fetchData = async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('documents').select('*').order('created_at'),
      supabase.from('codes').select('*').order('label'),
    ])
    setDocs(d || [])
    setCodes(c || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCopy = (code, label) => {
    navigator.clipboard.writeText(code).then(() => showToast(`✅ ${label} copiado`))
  }

  const handleView = async (doc, qr = false) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.storage_path)
    setViewDoc({ ...doc, url: data.publicUrl })
    setQrMode(qr)
  }

  const isQrType = (type) => ['boarding_pass', 'ticket', 'voucher', 'esta'].includes(type)

  const filteredDocs  = filtrarPorPerfil(docs.map(d => ({ ...d, people: d.owner_id ? [d.owner_id] : [] })))
  const filteredCodes = filtrarPorPerfil(codes)

  if (loading || appLoading) {
    return <div className="loading"><div className="spinner" /><span>Cargando documentos...</span></div>
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>📄 Documentos y Códigos</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowUpload(true)}
        >
          + Subir
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['docs', '📄 Documentos'], ['codes', '🔑 Códigos']].map(([id, label]) => (
          <button
            key={id}
            className={`btn btn-sm ${tab === id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(id)}
            style={{ flex: 1 }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'docs' && (
        filteredDocs.length === 0
          ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-title">Sin documentos</div>
              <div className="empty-text" style={{ marginBottom: 16 }}>Subí tu primer documento con el botón de arriba.</div>
              <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Subir documento</button>
            </div>
          )
          : filteredDocs.map(doc => <DocCard key={doc.id} doc={doc} onView={handleView} />)
      )}

      {tab === 'codes' && (
        <CodesSection codes={filteredCodes} onCopy={handleCopy} />
      )}

      {/* Modal subir documento */}
      {showUpload && (
        <UploadModal
          family={family}
          people={people}
          onClose={() => setShowUpload(false)}
          onSaved={() => {
            setShowUpload(false)
            fetchData()
            showToast('✅ Documento subido')
          }}
        />
      )}

      {/* QR fullscreen */}
      {viewDoc && qrMode && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setQrMode(false)}
        >
          <div style={{ color: '#fff', fontSize: '0.72rem', opacity: 0.5, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {viewDoc.name} · Tocá para cerrar
          </div>
          <img
            src={viewDoc.url}
            alt={viewDoc.name}
            style={{ maxWidth: '95vw', maxHeight: '80dvh', borderRadius: 12, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ color: '#fff', fontSize: '0.68rem', opacity: 0.35, marginTop: 12 }}>
            📲 Mostrá esta pantalla para escanear en el aeropuerto
          </div>
        </div>
      )}

      {/* Visor de documento */}
      {viewDoc && !qrMode && (
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">{viewDoc.name}</div>
            {viewDoc.url && (
              viewDoc.storage_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                ? <img src={viewDoc.url} alt={viewDoc.name} style={{ width: '100%', borderRadius: 10 }} />
                : <a href={viewDoc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
                    📂 Abrir documento
                  </a>
            )}
            {isQrType(viewDoc.type) && viewDoc.storage_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 12, background: '#18181B' }}
                onClick={() => setQrMode(true)}
              >
                📲 Mostrar QR para escanear
              </button>
            )}
            <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setViewDoc(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
