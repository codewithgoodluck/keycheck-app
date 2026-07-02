import { useState } from 'react'
import { Home, LogIn, UserPlus } from 'lucide-react'
import { listerSignIn, listerSignUp } from '../lib/listerAuth.js'

// Mirrors AdminLogin.jsx's layout, but with a sign-up/sign-in toggle —
// unlike moderators (created manually in the Firebase Console), listers
// self-register.
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
      setView('my-listings')
    } catch (err) {
      console.error('Lister auth failed:', err)
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
          <Home size={20} />
        </span>
        <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 22, margin: '0 0 6px' }}>
          {mode === 'signup' ? 'Create a lister account' : 'Lister sign-in'}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: 0 }}>
          List a property and manage your listings. Every listing is reviewed before it
          appears publicly.
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
          {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>}
          <button className="submit-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {mode === 'signup' ? <UserPlus size={15} /> : <LogIn size={15} />}
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
