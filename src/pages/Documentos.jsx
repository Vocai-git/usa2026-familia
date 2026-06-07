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

// URL del documento servida por la propia app (mismo origen → cacheable offline)
const docUrl = (p) => `/api/doc?path=${encodeURIComponent(p)}`
const isImageFile = (p) => /\.(jpg|jpeg|png|gif|webp)$/i.test(p || '')
// QR a pantalla completa solo para imágenes escaneables (boarding pass, entradas con QR)
const canShowQr = (doc) => isImageFile(doc.storage_path) && ['boarding_pass', 'ticket'].includes(doc.type)

function DocCard({ doc, onView }) {
  const { people } = useApp()
  const type = DOC_TYPES[doc.type] || DOC_TYPES.other
  const owner = people.find(p => p.id === doc.owner_id)
  const qr = canShowQr(doc)

  return (
    <div className="doc-card" style={qr ? { borderLeft: '3px solid var(--accent)' } : {}}>
      <span className="doc-icon">{type.icon}</span>
      <div style={{ flex: 1 }}>
        <div className="doc-name">{doc.name}</div>
        <div className="doc-type">{type.label}{owner ? ` · ${owner.name}` : ''}</div>
        {doc.notes && <div className="text-sm text-muted" style={{ marginTop: 4 }}>{doc.notes}</div>}
      </div>
      {doc.storage_path && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onView(doc, false)}
            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
          >
            👁 Ver
          </button>
          {qr && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onView(doc, true)}
              style={{ fontSize: '0.72rem', padding: '5px 10px', background: '#18181B' }}
            >
              📲 QR
            </button>
          )}
        </div>
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

function UploadModal({ family, onClose, onSaved }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const save = async () => {
    if (!files.length) { setError('Elegí al menos un archivo.'); return }
    setError(null)
    setUploading(true)
    const resultados = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setStatus(`🤖 Leyendo ${i + 1}/${files.length}: ${file.name}...`)
      const ext = file.name.split('.').pop()
      const path = `entrada/${family.id}/${Date.now()}_${i}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
      if (uploadErr) { resultados.push(`❌ ${file.name}: no se pudo subir`); continue }
      try {
        const r = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: path, familyId: family.id, fileName: file.name }),
        })
        const data = await r.json()
        resultados.push(data.ok ? `✅ ${data.summary}` : `⚠️ ${file.name}: error al procesar`)
      } catch {
        resultados.push(`⚠️ ${file.name}: el servidor no respondió`)
      }
    }
    setUploading(false)
    setStatus(null)
    onSaved(resultados)
  }

  return (
    <div className="modal-overlay" onClick={uploading ? undefined : onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">🤖 Subir documentos</div>
        <p className="text-sm text-muted" style={{ marginTop: 4 }}>
          Elegí tus archivos (pasaportes, vuelos, reservas, entradas…). La IA los lee y carga sola.
        </p>

        <div style={{ marginTop: 16 }}>
          <label className="form-label">Archivos (fotos, PDF o capturas)</label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={e => setFiles(Array.from(e.target.files))}
            style={{ width: '100%', marginTop: 6, fontSize: '0.85rem' }}
            disabled={uploading}
          />
          {files.length > 0 && (
            <div className="text-sm text-muted" style={{ marginTop: 8 }}>
              {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {status && (
          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-soft, #f4f4f5)', borderRadius: 10, fontSize: '0.85rem' }}>
            {status}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, color: 'var(--red)', fontSize: '0.82rem' }}>⚠️ {error}</div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          onClick={save}
          disabled={uploading || !files.length}
        >
          {uploading ? '🤖 Procesando con IA...' : '⬆️ Subir y leer con IA'}
        </button>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={onClose} disabled={uploading}>
          {uploading ? 'Esperá...' : 'Cancelar'}
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

  const filteredDocs  = filtrarPorPerfil(docs.map(d => ({ ...d, people: d.owner_id ? [d.owner_id] : [] })))
  const filteredCodes = filtrarPorPerfil(codes)

  // Precargar documentos para que estén disponibles sin conexión (el SW los cachea)
  useEffect(() => {
    if (!navigator.onLine) return
    filteredDocs.forEach(d => { if (d.storage_path) fetch(docUrl(d.storage_path)).catch(() => {}) })
  }, [docs])

  const handleCopy = (code, label) => {
    navigator.clipboard.writeText(code).then(() => showToast(`✅ ${label} copiado`))
  }

  const closeViewer = () => {
    if (viewDoc?.url?.startsWith('blob:')) URL.revokeObjectURL(viewDoc.url)
    setViewDoc(null)
    setQrMode(false)
  }

  const handleView = async (doc, qr = false) => {
    setQrMode(qr)
    setViewDoc({ ...doc, loading: true })
    try {
      const r = await fetch(docUrl(doc.storage_path))
      if (!r.ok) throw new Error()
      const blob = await r.blob()
      setViewDoc({ ...doc, url: URL.createObjectURL(blob), isImage: isImageFile(doc.storage_path), loading: false })
    } catch {
      setViewDoc({ ...doc, error: true, loading: false })
    }
  }

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
          onClose={() => setShowUpload(false)}
          onSaved={(resultados) => {
            setShowUpload(false)
            fetchData()
            const okCount = (resultados || []).filter(r => r.startsWith('✅')).length
            showToast(okCount > 0 ? `✅ IA cargó ${okCount} documento${okCount > 1 ? 's' : ''}` : '⚠️ Revisá los documentos')
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
          onClick={closeViewer}
        >
          <div style={{ color: '#fff', fontSize: '0.72rem', opacity: 0.5, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {viewDoc.name} · Tocá para cerrar
          </div>
          {viewDoc.loading
            ? <div className="spinner" />
            : viewDoc.url && <img
                src={viewDoc.url}
                alt={viewDoc.name}
                style={{ maxWidth: '95vw', maxHeight: '80dvh', borderRadius: 12, objectFit: 'contain' }}
                onClick={e => e.stopPropagation()}
              />}
          <div style={{ color: '#fff', fontSize: '0.68rem', opacity: 0.35, marginTop: 12 }}>
            📲 Mostrá esta pantalla para escanear en el aeropuerto
          </div>
        </div>
      )}

      {/* Visor de documento */}
      {viewDoc && !qrMode && (
        <div className="modal-overlay" onClick={closeViewer}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="sheet-handle" />
            <div className="sheet-title">{viewDoc.name}</div>

            {viewDoc.loading && (
              <div className="loading" style={{ padding: 32 }}><div className="spinner" /><span>Cargando documento...</span></div>
            )}
            {viewDoc.error && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                ⚠️ No se pudo cargar el documento.<br />
                <span className="text-sm">Si no tenés conexión, ábrelo una vez con internet para guardarlo offline.</span>
              </div>
            )}
            {!viewDoc.loading && !viewDoc.error && viewDoc.url && (
              viewDoc.isImage
                ? <img src={viewDoc.url} alt={viewDoc.name} style={{ width: '100%', borderRadius: 10 }} />
                : <>
                    <iframe
                      title={viewDoc.name}
                      src={viewDoc.url}
                      style={{ width: '100%', height: '70dvh', border: 'none', borderRadius: 10, background: '#fff' }}
                    />
                    <a href={viewDoc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
                      📂 Abrir en pantalla completa
                    </a>
                  </>
            )}
            {!viewDoc.loading && !viewDoc.error && canShowQr(viewDoc) && (
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 12, background: '#18181B' }}
                onClick={() => setQrMode(true)}
              >
                📲 Mostrar QR para escanear
              </button>
            )}
            <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={closeViewer}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
