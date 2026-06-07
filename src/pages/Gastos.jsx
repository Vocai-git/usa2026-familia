import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const EUR_RATE = 0.91

const CATS = {
  comida:      { label: 'Comida',      emoji: '🍔', color: '#F97316' },
  transporte:  { label: 'Transporte',  emoji: '🚇', color: '#3B82F6' },
  compras:     { label: 'Compras',     emoji: '🛍️', color: '#EC4899' },
  entradas:    { label: 'Entradas',    emoji: '🎟️', color: '#8B5CF6' },
  alojamiento: { label: 'Alojamiento', emoji: '🏨', color: '#0EA5E9' },
  otros:       { label: 'Otros',       emoji: '📌', color: '#6B7280' },
}
const CAT_KEYS = Object.keys(CATS)

const fmtUsd = (n) => '$' + n.toLocaleString('es-ES', { maximumFractionDigits: 0 })
const fmtEur = (n) => Math.round(n * EUR_RATE).toLocaleString('es-ES') + '€'

export default function Gastos() {
  const { family } = useApp()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ concept: '', amount: '', category: 'comida' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    if (!family?.id) return
    const { data } = await supabase.from('expenses').select('*').eq('family_id', family.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [family])

  const total = items.reduce((s, e) => s + Number(e.amount_usd), 0)
  const porCat = CAT_KEYS.map(k => ({
    k, ...CATS[k],
    sum: items.filter(e => e.category === k).reduce((s, e) => s + Number(e.amount_usd), 0),
  })).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum)

  const save = async () => {
    const amount = parseFloat(String(form.amount).replace(',', '.'))
    if (!form.concept.trim() || !amount || amount <= 0) return
    setSaving(true)
    await supabase.from('expenses').insert({
      family_id: family.id, concept: form.concept.trim(),
      amount_usd: amount, category: form.category,
    })
    setSaving(false); setModal(false)
    setForm({ concept: '', amount: '', category: 'comida' })
    fetchData()
  }

  const del = async (id) => {
    if (!confirm('¿Borrar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando gastos...</span></div>

  return (
    <div className="page">
      <h2 className="page-title">💰 Gastos · {family?.name}</h2>

      {/* Total */}
      <div className="card" style={{ marginBottom: 16, textAlign: 'center', background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', color: '#fff', border: 'none' }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total gastado</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>{fmtUsd(total)}</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>≈ {fmtEur(total)}</div>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => setModal(true)} style={{ marginBottom: 16 }}>
        + Agregar gasto
      </button>

      {/* Por categoría */}
      {porCat.length > 0 && (
        <>
          <div className="section-label">Por categoría</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {porCat.map(c => (
              <div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem' }}>{c.label}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{fmtUsd(c.sum)}</span>
                <span className="text-xs text-muted" style={{ minWidth: 48, textAlign: 'right' }}>{fmtEur(c.sum)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lista */}
      <div className="section-label">Movimientos</div>
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <div className="empty-title">Sin gastos todavía</div>
          <div className="empty-text">Anotá lo que vayan gastando con el botón de arriba.</div>
        </div>
      ) : items.map(e => {
        const c = CATS[e.category] || CATS.otros
        return (
          <div key={e.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
            <span style={{ fontSize: '1.4rem' }}>{c.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.concept}</div>
              <div className="text-xs text-muted">
                {c.label} · {new Date(e.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{fmtUsd(Number(e.amount_usd))}</div>
              <div className="text-xs text-muted">{fmtEur(Number(e.amount_usd))}</div>
            </div>
            <button onClick={() => del(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>🗑️</button>
          </div>
        )
      })}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={saving ? undefined : () => setModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">💰 Nuevo gasto</div>
            <input className="form-input" placeholder="¿En qué? Ej: Cena en Miami" value={form.concept}
              onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} style={{ width: '100%', marginTop: 14 }} />
            <input className="form-input" type="number" inputMode="decimal" placeholder="Monto en USD ($)" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ width: '100%', marginTop: 10 }} />
            {form.amount > 0 && <div className="text-xs text-muted" style={{ marginTop: 4 }}>≈ {fmtEur(parseFloat(form.amount) || 0)}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {CAT_KEYS.map(k => (
                <button key={k} onClick={() => setForm(f => ({ ...f, category: k }))}
                  className={`profile-pill${form.category === k ? ' active' : ''}`}
                  style={{ fontSize: '0.8rem' }}>
                  {CATS[k].emoji} {CATS[k].label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </button>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setModal(false)} disabled={saving}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
