import { useState } from 'react'
import { ArrowLeft, Mail, BellRing, KeyRound, LogOut } from 'lucide-react'
import { listerSignOut, sendAccountPasswordReset } from '../lib/listerAuth.js'
import { enablePushNotifications, getStoredPushToken, isPushSupported } from '../lib/push.js'

export default function Settings({ listerUser, setView }) {
  const [pushEnabled, setPushEnabled] = useState(() => Boolean(getStoredPushToken()))
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  if (!listerUser) {
    return (
      <div className="empty-state">
        <p>Sign in to view settings.</p>
        <button onClick={() => setView('lister-auth')}>Sign in</button>
      </div>
    )
  }

  async function handleEnablePush() {
    setPushError('')
    setPushBusy(true)
    try {
      await enablePushNotifications()
      setPushEnabled(true)
    } catch (err) {
      setPushError(err.message)
    } finally {
      setPushBusy(false)
    }
  }

  async function handleResetPassword() {
    setResetError('')
    try {
      await sendAccountPasswordReset(listerUser.email)
      setResetSent(true)
    } catch (err) {
      setResetError(err.message)
    }
  }

  return (
    <div className="form-wrap">
      <div className="page-banner">
        <h1>Settings</h1>
        <p>Manage your account and notification preferences.</p>
      </div>

      <button className="detail-back" onClick={() => setView('my-profile')} style={{ marginTop: 0 }}>
        <ArrowLeft size={15} /> Back to profile
      </button>

      <div className="form-card" style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={16} /> Account
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>{listerUser.email}</p>

        <button className="chip" onClick={handleResetPassword} disabled={resetSent}>
          <KeyRound size={13} /> {resetSent ? 'Reset link sent — check your email' : 'Send password reset link'}
        </button>
        {resetError && <p style={{ color: 'var(--status-disputed)', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{resetError}</p>}
      </div>

      <div className="form-card" style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BellRing size={16} /> Notifications
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
          Get notified on this device when a new report or listing matches something you're watching
          (see the areas/names you've saved on the Saved page).
        </p>
        {!isPushSupported() ? (
          <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Not supported in this browser.</p>
        ) : pushEnabled ? (
          <span className="chip active" style={{ cursor: 'default' }}>
            <BellRing size={13} /> Notifications on for this device
          </span>
        ) : (
          <button className="chip" onClick={handleEnablePush} disabled={pushBusy}>
            <BellRing size={13} /> {pushBusy ? 'Requesting...' : 'Enable notifications on this device'}
          </button>
        )}
        {pushError && <p style={{ color: 'var(--status-disputed)', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{pushError}</p>}
      </div>

      <div className="form-card">
        <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Sign out</p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
          You'll need to sign in again to report, comment, or list a property.
        </p>
        <button
          className="icon-btn"
          style={{ width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600, gap: 6, display: 'flex', alignItems: 'center' }}
          onClick={() => {
            listerSignOut()
            setView('home')
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )
}
