import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FALLBACK_CONTACTS = [
  { id: '1', label: 'Consulado argentino · Miami', phone: '+1 305 373 1889', notes: 'Lunes a viernes 9-13h', sort_order: 1 },
  { id: '2', label: 'Consulado argentino · NY', phone: '+1 212 603 0400', notes: 'Emergencias 24h', sort_order: 2 },
  { id: '3', label: 'Assist Card desde USA', phone: '+1 877 222 0220', notes: 'Tener número de póliza a mano', sort_order: 3 },
  { id: '4', label: 'Emergencias USA', phone: '911', notes: 'Policía, bomberos, ambulancia', sort_order: 4 },
  { id: '5', label: 'American Airlines', phone: '+1 800 433 7300', notes: 'Cambios de vuelo', sort_order: 5 },
  { id: '6', label: 'Royal Caribbean', phone: '+1 800 256 6649', notes: 'Emergencias crucero', sort_order: 6 },
]

export default function Emergencias() {
  const [contacts, setContacts] = useState(FALLBACK_CONTACTS)

  useEffect(() => {
    supabase.from('emergency_contacts').select('*').order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setContacts(data)
    })
  }, [])

  return (
    <div className="page">
      <h2 className="page-title">🆘 Emergencias</h2>

      <div className="card" style={{ borderLeft: '4px solid var(--red)', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>⚠️ Disponible sin internet</div>
        <div className="text-sm text-muted">
          Esta pantalla funciona offline. Guardá los números importantes antes de salir.
        </div>
      </div>

      {contacts.map(c => (
        <div key={c.id} className="emergency-card" style={{ marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.label}</div>
            {c.notes && <div className="text-sm text-muted" style={{ marginTop: 2 }}>{c.notes}</div>}
            <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="emergency-phone" style={{ display: 'block', marginTop: 6 }}>
              📞 {c.phone}
            </a>
          </div>
          <a
            href={`tel:${c.phone.replace(/\s/g, '')}`}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            Llamar
          </a>
        </div>
      ))}

      <div className="section-title" style={{ marginTop: 24 }}>💊 Tips de seguridad</div>
      <div className="card">
        {[
          '📋 Tené el número de tu seguro de viaje guardado',
          '💳 Avisá al banco antes de salir para evitar bloqueos',
          '📱 Guardá los números de emergencia SIN internet',
          '🏥 En emergencias médicas: llamá al 911 primero',
          '🛂 Pasaportes siempre en lugar seguro (no en auto)',
          '📸 Fotocopia digital de documentos en la app',
        ].map((tip, i) => (
          <div key={i} className="check-item" style={{ cursor: 'default' }}>
            <span style={{ flex: 1, fontSize: '0.88rem' }}>{tip}</span>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>🏥 Farmacias 24h en Orlando</div>
      <div className="card">
        {[
          { name: 'CVS Pharmacy', address: '8301 International Dr, Orlando', phone: '+1 407 351 0051' },
          { name: 'Walgreens', address: '7324 International Dr, Orlando', phone: '+1 407 352 3404' },
        ].map((ph, i) => (
          <div key={i} className="check-item" style={{ cursor: 'default' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ph.name}</div>
              <div className="text-sm text-muted">{ph.address}</div>
              <a href={`tel:${ph.phone}`} style={{ color: 'var(--blue)', fontSize: '0.85rem', fontWeight: 700 }}>{ph.phone}</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
