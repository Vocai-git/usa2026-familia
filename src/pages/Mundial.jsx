import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const docUrl = (p) => `/api/doc?path=${encodeURIComponent(p)}`
const isImageFile = (p) => /\.(jpg|jpeg|png|gif|webp)$/i.test(p || '')

export default function Mundial() {
  const { family } = useApp()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchData = async () => {
    const { data } = await supabase.from('documents').select('*').eq('type', 'mundial').order('created_at')
    const mine = (data || []).filter(d => !d.family_id || d.family_id === family?.id)
    setDocs(mine)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [family])

  // Precarga offline
  useEffect(() => {
    if (!navigator.onLine) return
    docs.forEach(d => { if (d.storage_path) fetch(docUrl(d.storage_path)).catch(() => {}) })
  }, [docs])

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2500) }

  const save = async () => {
    if (!files.length) return
    setUploading(true)
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setStatus(`🤖 Leyendo ${i + 1}/${files.length}: ${file.name}...`)
      const ext = file.name.split('.').pop()
      const path = `mundial/${family.id}/${Date.now()}_${i}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
      if (error) continue
      try {
        const r = await fetch('/api/parse-document', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: path, familyId: family.id, fileName: file.name, forceType: 'mundial' }),
        })
        if ((await r.json()).ok) ok++
      } catch { /* ignora */ }
    }
    setUploading(false)
    setStatus(null)
    setShowUpload(false)
    setFiles([])
    fetchData()
    showToast(ok > 0 ? `✅ ${ok} entrada${ok > 1 ? 's' : ''} cargada${ok > 1 ? 's' : ''}` : '⚠️ Revisá los archivos')
  }

  const openDoc = async (doc) => {
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
  const closeDoc = () => {
    if (viewDoc?.url?.startsWith('blob:')) URL.revokeObjectURL(viewDoc.url)
    setViewDoc(null)
  }

  return (
    <div className="page">
      <div className="hero-card" style={{ background: 'linear-gradient(135deg, #14532D 0%, #16A34A 60%, #22C55E 100%)', marginBottom: 16 }}>
        <div className="hero-eyebrow">Mundial 2026</div>
        <div className="hero-title">⚽ Mundial</div>
        <div className="hero-sub">Cargá acá tus entradas y se guardan para verlas sin conexión.</div>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => setShowUpload(true)} style={{ marginBottom: 16 }}>
        + Subir entrada del Mundial
      </button>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Cargando...</span></div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <div className="empty-title">Sin entradas todavía</div>
          <div className="empty-text">Subí las entradas del Mundial con el botón de arriba. La IA las lee sola.</div>
        </div>
      ) : (
        <div className="doc-grid">
          {docs.map(doc => (
            <div key={doc.id} className="doc-card">
              <span className="doc-icon">⚽</span>
              <div style={{ flex: 1 }}>
                <div className="doc-name">{doc.name}</div>
                {doc.notes && <div className="text-sm text-muted" style={{ marginTop: 4 }}>{doc.notes}</div>}
              </div>
              {doc.storage_path && (
                <button className="btn btn-secondary btn-sm" onClick={() => openDoc(doc)} style={{ fontSize: '0.72rem', padding: '5px 10px', flexShrink: 0 }}>
                  👁 Ver
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal subir */}
      {showUpload && (
        <div className="modal-overlay" onClick={uploading ? undefined : () => setShowUpload(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">⚽ Subir entradas</div>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>Fotos o PDF de tus entradas del Mundial. La IA las lee y carga sola.</p>
            <input type="file" multiple accept="image/*,.pdf" disabled={uploading}
              onChange={e => setFiles(Array.from(e.target.files))}
              style={{ width: '100%', marginTop: 14, fontSize: '0.85rem' }} />
            {files.length > 0 && <div className="text-sm text-muted" style={{ marginTop: 8 }}>{files.length} archivo{files.length > 1 ? 's' : ''}</div>}
            {status && <div style={{ marginTop: 14, padding: 12, background: '#f4f4f5', borderRadius: 10, fontSize: '0.85rem' }}>{status}</div>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={save} disabled={uploading || !files.length}>
              {uploading ? '🤖 Procesando...' : '⬆️ Subir y leer con IA'}
            </button>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setShowUpload(false)} disabled={uploading}>
              {uploading ? 'Esperá...' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}

      {/* Visor */}
      {viewDoc && (
        <div className="modal-overlay" onClick={closeDoc}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="sheet-handle" />
            <div className="sheet-title">{viewDoc.name}</div>
            {viewDoc.loading && <div className="loading" style={{ padding: 32 }}><div className="spinner" /></div>}
            {viewDoc.error && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>⚠️ No se pudo cargar. Abrilo una vez con internet para guardarlo offline.</div>}
            {!viewDoc.loading && !viewDoc.error && viewDoc.url && (
              viewDoc.isImage
                ? <img src={viewDoc.url} alt={viewDoc.name} style={{ width: '100%', borderRadius: 10 }} />
                : <iframe title={viewDoc.name} src={viewDoc.url} style={{ width: '100%', height: '70dvh', border: 'none', borderRadius: 10, background: '#fff' }} />
            )}
            <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={closeDoc}>Cerrar</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
