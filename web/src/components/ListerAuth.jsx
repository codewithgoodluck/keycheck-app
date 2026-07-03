import { useState } from 'react'
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react'
import { listerSignIn, listerSignUp } from '../lib/listerAuth.js'

// Mirrors AdminLogin.jsx's layout, but with a sign-up/sign-in toggle —
// unlike moderators (created manually in the Firebase Console), regular
// users self-register. Originally lister-only (hence the file/prop
// names — see lib/listerAuth.js), now the general account gate for
// reporting, commenting, and listing alike: a "user" account isn't a
// different thing from a "lister" account, just the same Firebase Auth
// user used for a different action.
export default function ListerAuth({ setView }) {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await listerSignUp(email, password)
      } else {
        await listerSignIn(email, password)
      }
      setView('my-profile')
    } catch (err) {
      console.error('Account auth failed:', err)
      setError(`${mode === 'signup' ? 'Sign-up' : 'Sign-in'} failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span
          style={{
            display: 'inline-flex',
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--ink)',
            color: 'var(--paper)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14
          }}
        >
          <ShieldCheck size={20} />
        </span>
        <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 22, margin: '0 0 6px' }}>
          {mode === 'signup' ? 'Create an account' : 'Sign in'}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: 0 }}>
          Needed to report a problem, comment, or list a property. Search and browsing stay free
          for anyone, no account required.
        </p>
      </div>

      <div className="chip-row" style={{ marginBottom: 20, justifyContent: 'center' }}>
        <button type="button" className={`chip ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>
          <UserPlus size={13} /> Sign up
        </button>
        <button type="button" className={`chip ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>
          <LogIn size={13} /> Sign in
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="lister-email">Email</label>
            <input id="lister-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="lister-password">Password</label>
            <input
              id="lister-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>}
          <button className="submit-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {mode === 'signup' ? <UserPlus size={15} /> : <LogIn size={15} />}
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
