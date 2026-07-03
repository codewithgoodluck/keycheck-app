import { useState } from 'react'
import { ShieldCheck, LogIn } from 'lucide-react'
import { adminLogin } from '../lib/adminApi.js'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email, password)
    } catch (err) {
      console.error('Admin sign-in failed:', err)
      setError(`Sign-in failed: ${err.message}`)
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
        <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 22, margin: '0 0 6px' }}>Moderator sign-in</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: 0 }}>
          This panel manages report and reply status. Create a moderator account in the
          Firebase Console under Authentication first.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>}
          <button className="submit-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            <LogIn size={15} /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
