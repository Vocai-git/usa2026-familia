import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../context/AdminContext'

export default function Dashboard() {
  const { isSuper, familyId, session } = useAdmin()
  const [counts, setCounts] = useState({ events: 0, documents: 0, codes: 0, alarms: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const filt = (q) => isSuper ? q : q.or(`family_id.eq.${familyId},family_id.is.null`)
    Promise.all([
      filt(supabase.from('events').select('*', { count: 'exact', head: true })),
      filt(supabase.from('documents').select('*', { count: 'exact', head: true })),
      filt(supabase.from('codes').select('*', { count: 'exact', head: true })),
      filt(supabase.from('alarms').select('*', { count: 'exact', head: true })),
      filt(supabase.from('events').select('id,title,date,type,family_id').order('created_at', { ascending: false }).limit(5)),
    ]).then(([e, d, c, a, r]) => {
      setCounts({ events: e.count||0, documents: d.count||0, codes: c.count||0, alarms: a.count||0 })
      setRecent(r.data||[])
    })
  }, [isSuper, familyId])

  const TYPE_ICON = { flight:'✈️', hotel:'🏨', car:'🚗', park:'🎢', cruise:'🚢', restaurant:'🍽️', other:'📌' }

  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h1 className="fw-800" style={{ fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
          Bienvenido, {session?.family?.name} {session?.family?.emoji}
        </h1>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>
          {isSuper ? 'Tenés acceso total a todos los datos del viaje.' : 'Gestioná los datos de tu familia para el viaje.'}
        </p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Eventos', value: counts.events, icon: '📅', to: '/admin/eventos', color: '#2563EB' },
          { label: 'Documentos', value: counts.documents, icon: '📄', to: '/admin/documentos', color: '#16A34A' },
          { label: 'Códigos', value: counts.codes, icon: '🔑', to: '/admin/codigos', color: '#D97706' },
          { label: 'Alarmas', value: counts.alarms, icon: '🔔', to: '/admin/alarmas', color: '#7C3AED' },
        ].map(({ label, value, icon, to, color }) => (
          <Link key={to} to={to} style={{ display: 'block' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.12s' }}>
              <div className="stat-label">{icon} {label}</div>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-sub">Ver todos →</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚡ Acciones rápidas</div>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { to: '/admin/eventos', label: '📅 Agregar vuelo / hotel', desc: 'Nuevo evento al itinerario' },
              { to: '/admin/documentos', label: '📄 Subir documento', desc: 'ESTA, pasaporte, voucher' },
              { to: '/admin/codigos', label: '🔑 Agregar código', desc: 'PNR, confirmación, reserva' },
              { to: '/admin/alarmas', label: '🔔 Nueva alarma', desc: 'Check-in, crucero, devolución auto' },
            ].map(({ to, label, desc }) => (
              <Link key={to} to={to} style={{ display: 'block' }}>
                <div style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'all 0.12s', background: 'var(--surface)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div className="fw-700 text-sm">{label}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🕐 Últimos eventos</div>
          </div>
          <div style={{ padding: '0 4px' }}>
            {recent.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Sin eventos todavía
              </div>
            )}
            {recent.map(ev => (
              <div key={ev.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON[ev.type]||'📌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-700 text-sm truncate">{ev.title}</div>
                  <div className="text-xs text-muted">{ev.date}</div>
                </div>
                {ev.family_id && <span className="badge badge-blue">{ev.family_id}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">📋 Resumen del viaje</div>
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            ['Salida', '10 jun 2026'],
            ['Regreso', '19 jul 2026'],
            ['Duración', '40 días'],
            ['Crucero', '28 jun – 5 jul'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-light" style={{ marginBottom: 4 }}>{k}</div>
              <div className="fw-700">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
