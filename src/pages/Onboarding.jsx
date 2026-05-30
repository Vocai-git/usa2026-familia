import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Onboarding() {
  const { families, loginFamily, loginAdmin } = useApp()
  const [step, setStep] = useState('pick')   // pick | code | admin
  const [selected, setSelected] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleSelect = (fam) => {
    setSelected(fam)
    setCode('')
    setError(false)
    setStep('code')
  }

  const handleLogin = () => {
    if (!selected) return
    const ok = loginFamily(selected, code)
    if (!ok) setError(true)
  }

  const handleAdmin = () => {
    const ok = loginAdmin(code)
    if (!ok) setError(true)
  }

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <div className="onboarding-tag">Viaje familiar · 40 días</div>
        <div className="onboarding-title">USA 2026</div>
        <div className="onboarding-sub">10 jun → 19 jul · Orlando · Crucero · Miami · NY</div>
      </div>

      <div className="onboarding-body">
        {step === 'pick' && (
          <>
            <div className="onboarding-q">¿Con qué familia viajás?</div>
            {families.map(fam => (
              <div
                key={fam.id}
                className="family-option"
                onClick={() => handleSelect(fam)}
              >
                <div className="family-emoji-big">{fam.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="family-option-name">{fam.name}</div>
                  <div className="family-option-sub">Ingresá tu código familiar</div>
                </div>
                <span className="family-option-arrow">›</span>
              </div>
            ))}
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 24, color: 'var(--text-light)', fontSize: '0.8rem' }}
              onClick={() => { setStep('admin'); setCode(''); setError(false) }}
            >
              Acceso administrador
            </button>
          </>
        )}

        {step === 'code' && selected && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 20, paddingLeft: 0, color: 'var(--text-muted)' }}
              onClick={() => setStep('pick')}
            >
              ← Volver
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div className="family-emoji-big">{selected.emoji}</div>
              <div>
                <div className="fw-800" style={{ fontSize: '1.1rem' }}>{selected.name}</div>
                <div className="text-xs text-muted">Ingresá el código que te compartió Agustín</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Código de acceso</label>
              <input
                className={`form-input${error ? ' border-red-500' : ''}`}
                style={error ? { borderColor: 'var(--red)' } : {}}
                type="password"
                placeholder="••••••••"
                value={code}
                autoFocus
                onChange={e => { setCode(e.target.value); setError(false) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {error && (
                <div style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 5, fontWeight: 600 }}>
                  Código incorrecto. Pedíselo a Agustín.
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleLogin}>
              Entrar →
            </button>
          </>
        )}

        {step === 'admin' && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 20, paddingLeft: 0, color: 'var(--text-muted)' }}
              onClick={() => setStep('pick')}
            >
              ← Volver
            </button>
            <div style={{ marginBottom: 24 }}>
              <div className="fw-800" style={{ fontSize: '1.1rem', marginBottom: 4 }}>⚙️ Acceso admin</div>
              <div className="text-xs text-muted">Solo para Agustín</div>
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña admin</label>
              <input
                className="form-input"
                style={error ? { borderColor: 'var(--red)' } : {}}
                type="password"
                placeholder="••••••••"
                value={code}
                autoFocus
                onChange={e => { setCode(e.target.value); setError(false) }}
                onKeyDown={e => e.key === 'Enter' && handleAdmin()}
              />
              {error && (
                <div style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 5, fontWeight: 600 }}>
                  Contraseña incorrecta.
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleAdmin}>
              Entrar →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
