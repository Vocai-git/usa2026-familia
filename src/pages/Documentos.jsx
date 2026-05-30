import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const DOC_TYPES = {
  passport: { label: 'Pasaporte', icon: '🛂' },
  esta: { label: 'ESTA', icon: '🇺🇸' },
  insurance: { label: 'Seguro de viaje', icon: '🏥' },
  voucher: { label: 'Voucher', icon: '🎫' },
  ticket: { label: 'Entrada', icon: '🎟️' },
  boarding_pass: { label: 'Boarding pass', icon: '✈️' },
  license: { label: 'Licencia', icon: '🚗' },
  other: { label: 'Otro', icon: '📄' },
}

function DocCard({ doc, onView }) {
  const { people } = useApp()
  const type = DOC_TYPES[doc.type] || DOC_TYPES.other
  const owner = people.find(p => p.id === doc.owner_id)

  return (
    <div className="doc-card" onClick={() => doc.storage_path && onView(doc)}>
      <span className="doc-icon">{type.icon}</span>
      <div style={{ flex: 1 }}>
        <div className="doc-name">{doc.name}</div>
        <div className="doc-type">
          {type.label}{owner ? ` · ${owner.name}` : ''}
        </div>
        {doc.notes && <div className="text-sm text-muted" style={{ marginTop: 4 }}>{doc.notes}</div>}
      </div>
      {doc.storage_path && (
        <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>👁</span>
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

export default function Documentos() {
  const { filtrarPorPerfil, loading: appLoading } = useApp()
  const [docs, setDocs] = useState([])
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('docs')
  const [viewDoc, setViewDoc] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  useEffect(() => {
    Promise.all([
      supabase.from('documents').select('*').order('created_at'),
      supabase.from('codes').select('*').order('label')
    ]).then(([{ data: d }, { data: c }]) => {
      setDocs(d || [])
      setCodes(c || [])
      setLoading(false)
    })
  }, [])

  const handleCopy = (code, label) => {
    navigator.clipboard.writeText(code).then(() => showToast(`✅ ${label} copiado`))
  }

  const handleView = async (doc) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.storage_path)
    setViewDoc({ ...doc, url: data.publicUrl })
  }

  const filteredDocs = filtrarPorPerfil(docs.map(d => ({ ...d, people: d.owner_id ? [d.owner_id] : ['todos'] })))
  const filteredCodes = filtrarPorPerfil(codes)

  if (loading || appLoading) {
    return <div className="loading"><div className="spinner" /><span>Cargando documentos...</span></div>
  }

  return (
    <div className="page">
      <h2 className="page-title">📄 Documentos y Códigos</h2>

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
          ? <div className="empty-state"><div className="icon">📄</div><p>Sin documentos cargados.</p><p className="text-sm" style={{ marginTop: 8 }}>Subí documentos desde el panel admin.</p></div>
          : filteredDocs.map(doc => <DocCard key={doc.id} doc={doc} onView={handleView} />)
      )}

      {tab === 'codes' && (
        <CodesSection codes={filteredCodes} onCopy={handleCopy} />
      )}

      {/* Modal visor de documento */}
      {viewDoc && (
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{viewDoc.name}</div>
            {viewDoc.url && (
              viewDoc.storage_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                ? <img src={viewDoc.url} alt={viewDoc.name} style={{ width: '100%', borderRadius: 10 }} />
                : <a href={viewDoc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
                    📂 Abrir documento
                  </a>
            )}
            <button className="btn btn-secondary btn-block" style={{ marginTop: 12 }} onClick={() => setViewDoc(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
