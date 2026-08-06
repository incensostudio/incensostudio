import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth'
import { Wordmark, AskSquare } from '../components/icons'

export function StaffLogin() {
  const signIn = useAuth((s) => s.signIn)
  const [email, setEmail] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const who = email.trim() ? email.trim().split('@')[0] : 'Reception'
    signIn(who)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#e5dcc9', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(400px, 100%)', background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 16, padding: 'clamp(24px, 6vw, 34px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
          <Wordmark />
        </div>
        <div style={{ textAlign: 'center', fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingBottom: 22 }}>Operating system · staff sign-in</div>

        <form onSubmit={submit}>
          <label style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>Work email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@incenso.studio" autoFocus style={inputStyle} />
          <label style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', marginTop: 12, display: 'block' }}>Passcode</label>
          <input type="password" placeholder="••••••" style={inputStyle} />
          <button type="submit" style={{ width: '100%', marginTop: 18, border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '13px', fontFamily: "'Geist Mono',monospace", fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Enter the floor
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 16, fontSize: 11, color: 'rgba(0,0,0,.5)' }}>
          <AskSquare size={7} />
          <span>Demo — any details sign you in.</span>
        </div>
        <div style={{ textAlign: 'center', paddingTop: 14 }}>
          <Link to="/" style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.45)' }}>← Back to incenso.studio</Link>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', marginTop: 6, background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit' }
