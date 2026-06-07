import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'
import { showToast } from '../../components/Toast'

const DOC_TYPES  = ['passport','esta','insurance','voucher','ticket','boarding_pass','license','other']
const DOC_LABELS = { passport:'Pasaporte 🛂', esta:'ESTA 🇺🇸', insurance:'Seguro 🏥', voucher:'Voucher 🎫', ticket:'Entrada 🎟️', boarding_pass:'Boarding Pass ✈️', license:'Licencia 🚗', other:'Otro 📄' }
const DOC_ICON   = { passport:'🛂', esta:'🇺🇸', insurance:'🏥', voucher:'🎫', ticket:'🎟️', boarding_pass:'✈️', license:'🚗', other:'📄' }

export default function Documentos() {
  const { isSuper, familyId, families } = useAdmin()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', type:'passport', owner_id:'', notes:'', family_id:'' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [viewUrl, setViewUrl] = useState(null)
  const [qrMode, setQrMode] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [aiStatus, setAiStatus] = useState(null)

  const fetch = async () => {
    setLoading(true)
    let q = supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (!isSuper) q = q.or(`family_id.eq.${familyId},family_id.is.null`)
    const { data } = await q
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [isSuper, familyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    // Modo IA: requiere archivo, lee y carga solo (igual que el móvil)
    if (useAI && file) {
      setUploading(true)
      setAiStatus(`🤖 Leyendo ${file.name}...`)
      const ext = file.name.split('.').pop()
      const path = `${form.type || 'doc'}/${form.owner_id || 'grupo'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
      if (error) { showToast('❌ Error al subir archivo'); setUploading(false); setAiStatus(null); return }
      try {
        const r = await fetch('/api/parse-document', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: path, familyId: form.family_id || null, fileName: file.name }),
        })
        const j = await r.json()
        showToast(j.ok ? `✅ ${j.summary || 'Documento cargado'}` : '⚠️ No se pudo leer')
      } catch { showToast('⚠️ Error de conexión con la IA') }
      setUploading(false); setAiStatus(null); setModal(false); setFile(null)
      setForm({ name:'', type:'passport', owner_id:'', notes:'', family_id:'' })
      fetch()
      return
    }
    // Modo manual
    if (!form.name) { showToast('⚠️ Poné un nombre o activá la IA con un archivo'); return }
    setUploading(true)
    let storage_path = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${form.type}/${form.owner_id || 'grupo'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
      if (!error) storage_path = path
      else { showToast('❌ Error al subir archivo'); setUploading(false); return }
    }
    await supabase.from('documents').insert({ ...form, storage_path, family_id: form.family_id || null })
    setUploading(false)
    setModal(false)
    setFile(null)
    setForm({ name:'', type:'passport', owner_id:'', notes:'', family_id:'' })
    fetch()
    showToast('✅ Documento guardado')
  }

  const del = async (id, path) => {
    if (!confirm('¿Eliminar este documento?')) return
    if (path) await supabase.storage.from('documents').remove([path])
    await supabase.from('documents').delete().eq('id', id)
    fetch(); showToast('🗑️ Eliminado')
  }

  const view = (doc, qr = false) => {
    if (!doc.storage_path) return
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.storage_path)
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.storage_path)
    setViewUrl({ url: data.publicUrl, name: doc.name, isImage, type: doc.type })
    setQrMode(qr)
  }

  const isQrType = (type) => ['boarding_pass', 'ticket', 'voucher', 'esta'].includes(type)

  return (
    <div className="content">
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="fw-800" style={{ fontSize: '1.3rem', letterSpacing: '-0.03em' }}>📄 Documentos</h1>
          <p className="text-muted text-sm mt-4">ESTA, pasaportes, seguros, vouchers y entradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name:'', type:'passport', owner_id:'', notes:'', family_id: isSuper ? '' : familyId }); setFile(null); setModal(true) }}>
          + Subir documento
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : docs.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
          <div className="fw-700">Sin documentos</div>
          <div className="text-sm" style={{ marginTop: 4 }}>Subí el primero haciendo click en "+ Subir documento"</div>
        </div>
      ) : (
        <div className="doc-grid">
          {docs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-icon">{DOC_ICON[doc.type] || '📄'}</div>
              <div className="doc-card-name">{doc.name}</div>
              <div className="doc-card-meta">{DOC_LABELS[doc.type] || doc.type}{doc.owner_id ? ` · ${doc.owner_id}` : ''}</div>
              {doc.notes && <div className="text-xs text-muted mt-4">{doc.notes}</div>}
              <div className="doc-card-actions">
                {doc.storage_path && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => view(doc)}>👁 Ver</button>
                    {isQrType(doc.type) && (
                      <button className="btn btn-primary btn-sm" onClick={() => view(doc, true)} title="Mostrar QR para escanear">
                        📲 QR
                      </button>
                    )}
                  </>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => del(doc.id, doc.storage_path)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📄 Subir documento</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: useAI ? '#eef2ff' : '#f4f4f5', border: `1px solid ${useAI ? '#c7d2fe' : '#e4e4e7'}`, borderRadius: 10, cursor: 'pointer', marginBottom: 14 }}>
                <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <div className="fw-700 text-sm">🤖 Leer con IA (recomendado)</div>
                  <div className="text-xs text-muted">Subí solo el archivo y la IA clasifica, extrae códigos y eventos sola.</div>
                </div>
              </label>

              {useAI ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Archivo (foto o PDF) *</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', marginTop: 4 }} />
                    {file && <div className="text-xs text-muted mt-4">📎 {file.name}</div>}
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
                  {aiStatus && <div style={{ marginTop: 14, padding: 12, background: '#eef2ff', borderRadius: 10, fontSize: '0.85rem' }}>{aiStatus}</div>}
                </>
              ) : (
              <>
              <div className="form-group">
                <label className="form-label">Nombre del documento *</label>
                <input className="form-input" placeholder="Ej: Pasaporte Agustín" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Titular (nombre)</label>
                  <input className="form-input" placeholder="agustin, belen..." value={form.owner_id} onChange={e => set('owner_id', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Archivo (foto o PDF)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Notas</label>
                <input className="form-input" placeholder="Opcional" value={form.notes} onChange={e => set('notes', e.target.value)} />
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
              </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)} disabled={uploading}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={uploading || (useAI && !file)}>
                {uploading ? '🤖 Procesando...' : (useAI ? '⬆️ Subir y leer con IA' : '⬆️ Subir')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewUrl && !qrMode && (
        <div className="modal-backdrop" onClick={() => setViewUrl(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{viewUrl.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isQrType(viewUrl.type) && viewUrl.isImage && (
                  <button className="btn btn-primary btn-sm" onClick={() => setQrMode(true)}>📲 Modo QR</button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => setViewUrl(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              {viewUrl.isImage
                ? <img src={viewUrl.url} alt={viewUrl.name} style={{ maxWidth: '100%', borderRadius: 8 }} />
                : <a href={viewUrl.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">📂 Abrir PDF</a>
              }
            </div>
          </div>
        </div>
      )}

      {viewUrl && qrMode && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setQrMode(false)}
        >
          <div style={{ color: '#fff', fontSize: '0.82rem', opacity: 0.6, marginBottom: 16, letterSpacing: '0.05em' }}>
            TOCÁ PARA CERRAR · {viewUrl.name.toUpperCase()}
          </div>
          {viewUrl.isImage && (
            <img
              src={viewUrl.url}
              alt={viewUrl.name}
              style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }}
              onClick={e => e.stopPropagation()}
            />
          )}
          <div style={{ color: '#fff', fontSize: '0.72rem', opacity: 0.4, marginTop: 16 }}>
            📲 Mostrá esta pantalla en el aeropuerto para escanear
          </div>
        </div>
      )}
    </div>
  )
}
