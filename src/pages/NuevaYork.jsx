const HOTEL = '350 W 39th St, New York, NY 10018'           // Hyatt Place Times Square
const HOTEL_Q = encodeURIComponent('Hyatt Place New York City Times Square, ' + HOTEL)
const LGA_Q = encodeURIComponent('LaGuardia Airport, New York')

const dir = (origin, dest, mode) =>
  `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${mode}`

const OPCIONES = [
  {
    emoji: '🚗', titulo: 'Uber / Lyft', precio: '~$35–60', tiempo: '25–45 min',
    desc: 'Lo más cómodo con equipaje y familia. Pedís desde la app, te lleva puerta a puerta.',
    reco: true, mode: 'driving',
  },
  {
    emoji: '🚕', titulo: 'Taxi amarillo', precio: '~$40–55 + peajes', tiempo: '25–45 min',
    desc: 'Hay parada de taxis a la salida. Se paga con tarjeta. Sumale propina (~15–20%).',
    mode: 'driving',
  },
  {
    emoji: '🚇', titulo: 'Bus + Metro', precio: '~$2.90', tiempo: '50–70 min',
    desc: 'El más barato: bus Q70 (LaGuardia Link) gratis hasta el metro, y de ahí a Times Square. Con poco equipaje.',
    mode: 'transit',
  },
]

export default function NuevaYork() {
  return (
    <div className="page">
      <h2 className="page-title">🗽 Nueva York</h2>

      {/* Llegada */}
      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', color: '#fff', border: 'none' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>✈️ Del aeropuerto al hotel</div>
        <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4 }}>
          Llegan a <strong>LaGuardia (LGA)</strong> → Hotel <strong>Hyatt Place Times Square</strong>
        </div>
      </div>

      {OPCIONES.map(o => (
        <div key={o.titulo} className="card" style={{ marginBottom: 10, borderLeft: o.reco ? '4px solid #16A34A' : '4px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.5rem' }}>{o.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {o.titulo} {o.reco && <span style={{ background: '#16A34A', color: '#fff', borderRadius: 6, padding: '1px 7px', fontSize: '0.62rem', marginLeft: 4 }}>RECOMENDADO</span>}
              </div>
              <div className="text-xs text-muted">{o.precio} · {o.tiempo}</div>
            </div>
          </div>
          <div className="text-sm text-muted" style={{ marginBottom: 10, lineHeight: 1.45 }}>{o.desc}</div>
          <a href={dir(LGA_Q, HOTEL_Q, o.mode)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm btn-block">
            🧭 Ver ruta en Google Maps
          </a>
        </div>
      ))}

      {/* Moverse por la ciudad */}
      <div className="section-label" style={{ marginTop: 20 }}>🚇 Cómo moverse por NY</div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Metro (subway)</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          La mejor forma de moverse. Pagás con <strong>OMNY</strong> apoyando la tarjeta del banco o el móvil (Apple Pay) directo en el molinete. $2.90 el viaje, y a partir de 12 viajes en la semana el resto es <strong>gratis</strong>.
        </div>
      </div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Caminar 🚶</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          Manhattan es muy caminable. Muchos imperdibles (Times Square, Quinta Avenida, Central Park, Rockefeller) están a pasos entre sí.
        </div>
      </div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Uber / Taxi 🚕</div>
        <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          Para grupos o de noche. Puede haber tráfico denso en Midtown — a veces el metro es más rápido.
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, borderLeft: '4px solid var(--accent)' }}>
        <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          💡 Todos los imperdibles de NY están cargados en el <strong>Mapa</strong> (Más → Mapa) con un toque para navegar a cada uno.
        </div>
      </div>
    </div>
  )
}
