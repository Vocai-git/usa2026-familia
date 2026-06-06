import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'

export default function Login() {
  const { families, tryLogin } = useAdmin()
  const [step, setStep] = useState('pick')
  const [selected, setSelected] = useState(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)

  const submit = () => {
    const ok = tryLogin(selected, code)
    if (!ok) setErr(true)
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-flag">🇺🇸</div>
          <div className="login-title">USA 2026</div>
          <div className="login-sub">Panel de gestión del viaje familiar</div>
        </div>

        <div className="login-body">
          {step === 'pick' && (
            <>
              <div className="login-q">¿Con qué familia ingresás?</div>
              {families.map(f => (
                <div key={f.id} className="family-opt" onClick={() => { setSelected(f); setStep('code'); setCode(''); setErr(false) }}>
                  <div className="fam-emoji">{f.emoji}</div>
                  <div>
                    <div className="fam-name">{f.name}</div>
                    <div className="fam-hint">Ingresá tu código familiar</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-light)' }}>›</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                <div
                  className="family-opt"
                  style={{ borderStyle: 'dashed' }}
                  onClick={() => { setSelected(null); setStep('code'); setCode(''); setErr(false) }}
                >
                  <div className="fam-emoji">⚙️</div>
                  <div>
                    <div className="fam-name">Super Admin</div>
                    <div className="fam-hint">Acceso total — solo Agustín</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-light)' }}>›</span>
                </div>
              </div>
            </>
          )}

          {step === 'code' && (
            <>
              <button className="login-back" onClick={() => setStep('pick')}>← Volver</button>
              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div className="fam-emoji" style={{ width: 44, height: 44, fontSize: '1.5rem' }}>{selected.emoji}</div>
                  <div>
                    <div className="fam-name" style={{ fontSize: '1rem' }}>{selected.name}</div>
                    <div className="fam-hint">Ingresá el código que te compartió Agustín</div>
                  </div>
                </div>
              )}
              {!selected && (
                <div style={{ marginBottom: 20 }}>
                  <div className="fam-name" style={{ fontSize: '1rem' }}>⚙️ Super Admin</div>
                  <div className="fam-hint">Contraseña de administrador</div>
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Código de acceso</label>
                <input
                  className="form-input"
                  style={err ? { borderColor: 'var(--red)' } : {}}
                  type="password"
                  placeholder="••••••••"
                  value={code}
                  autoFocus
                  onChange={e => { setCode(e.target.value); setErr(false) }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
                {err && <div className="err-msg">Código incorrecto.</div>}
              </div>
              <button className="btn btn-primary w-full btn-lg" onClick={submit}>
                Entrar al dashboard →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
