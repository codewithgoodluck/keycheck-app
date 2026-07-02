import { useEffect, useState } from 'react'
import { LogOut, Plus, ShieldCheck, ShieldAlert, Clock, ShieldX } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import { getMyListings, updateListingLifecycle } from '../lib/listingsApi.js'
import { listerSignOut } from '../lib/listerAuth.js'
import VerificationBadge from './VerificationBadge.jsx'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, rejected: ShieldX, blocked: ShieldAlert }
const LIFECYCLE_OPTIONS = ['active', 'under_offer', 'let', 'sold', 'expired']

export default function MyListings({ listerUser, setView }) {
  const [listings, setListings] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!listerUser) return
    refresh()
  }, [listerUser])

  function refresh() {
    getMyListings(listerUser.uid)
      .then(setListings)
      .catch((err) => {
        console.warn('Failed to load my listings:', err.message)
        setListings([])
      })
  }

  async function handleLifecycleChange(id, status) {
    setBusyId(id)
    try {
      await updateListingLifecycle(id, status)
      refresh()
    } catch (err) {
      alert('Failed to update listing: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (!listerUser) {
    return (
      <div className="empty-state">
        <p>Sign in to view your listings.</p>
        <button onClick={() => setView('lister-auth')}>Sign in</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 0 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 26, margin: '0 0 4px' }}>My listings</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: 0 }}>Signed in as {listerUser.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="chip active" onClick={() => setView('submit-listing')}>
            <Plus size={13} /> New listing
          </button>
          <button
            className="icon-btn"
            style={{ width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600, gap: 6, display: 'flex', alignItems: 'center' }}
            onClick={listerSignOut}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      <div className="report-list">
        {listings === null ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p>You haven't listed anything yet.</p>
            <button onClick={() => setView('submit-listing')}>List a property</button>
          </div>
        ) : (
          listings.map((listing) => {
            const Icon = STATUS_ICON[listing.status] || Clock
            return (
              <div key={listing.id} className="detail-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{TYPE_LABELS[listing.type] || listing.type}</p>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                      {listing.locationText}, {listing.state} · ₦{Number(listing.price).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`stamp-inline ${
                      listing.status === 'active' ? 'verified' : listing.status === 'rejected' || listing.status === 'blocked' ? 'disputed' : 'unverified'
                    }`}
                  >
                    <Icon /> {listing.status.replace('_', ' ')}
                  </span>
                </div>
                {listing.blockedReason && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: '0 0 8px' }}>{listing.blockedReason}</p>
                )}
                <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} />

                {['active', 'under_offer', 'let', 'sold', 'expired'].includes(listing.status) && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>Availability</label>
                    <select
                      value={listing.status}
                      onChange={(e) => handleLifecycleChange(listing.id, e.target.value)}
                      disabled={busyId === listing.id}
                      style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 13, background: 'var(--paper)' }}
                    >
                      {LIFECYCLE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
