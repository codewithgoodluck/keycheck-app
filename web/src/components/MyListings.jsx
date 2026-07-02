import { useEffect, useState } from 'react'
import { LogOut, Plus, ShieldCheck, ShieldAlert, Clock, ShieldX, RefreshCw, MessageSquare, ChevronDown, ChevronUp, Eye, Users } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import { getMyListings, updateListingLifecycle, renewListing, getEffectiveStatus, getListingViewCount } from '../lib/listingsApi.js'
import { getInquiriesForListing, markInquiryRead, getInquiryCount } from '../lib/inquiriesApi.js'
import { listerSignOut } from '../lib/listerAuth.js'
import VerificationBadge from './VerificationBadge.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, rejected: ShieldX, blocked: ShieldAlert, expired: ShieldX }
const LIFECYCLE_OPTIONS = ['active', 'under_offer', 'let', 'sold', 'expired']

export default function MyListings({ listerUser, setView }) {
  const [listings, setListings] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [inquiries, setInquiries] = useState(null)
  const [counts, setCounts] = useState({}) // listingId -> { views, inquiries }

  useEffect(() => {
    if (!listerUser) return
    refresh()
  }, [listerUser])

  // Cheap aggregation queries (getCountFromServer doesn't download
  // documents), so eager-fetching for every listing card is fine here —
  // unlike the full inquiry *list* below, which stays on-demand.
  useEffect(() => {
    if (!listings || listings.length === 0 || !listerUser) return
    let cancelled = false
    Promise.all(
      listings.map(async (l) => {
        const [views, inquiryCount] = await Promise.all([
          getListingViewCount(l.id, listerUser.uid).catch(() => 0),
          getInquiryCount(l.id, listerUser.uid).catch(() => 0)
        ])
        return [l.id, { views, inquiries: inquiryCount }]
      })
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [listings, listerUser])

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

  async function handleRenew(id) {
    setBusyId(id)
    try {
      await renewListing(id)
      refresh()
    } catch (err) {
      alert('Failed to renew listing: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  // Fetched on demand when a card's inquiries are expanded, not eagerly
  // for every listing on page load (see the plan this was built from).
  async function toggleInquiries(listingId) {
    if (expandedId === listingId) {
      setExpandedId(null)
      setInquiries(null)
      return
    }
    setExpandedId(listingId)
    setInquiries(null)
    try {
      setInquiries(await getInquiriesForListing(listingId, listerUser.uid))
    } catch (err) {
      console.warn('Failed to load inquiries:', err.message)
      setInquiries([])
    }
  }

  async function handleMarkRead(inquiryId) {
    try {
      await markInquiryRead(inquiryId)
      setInquiries((list) => list.map((i) => (i.id === inquiryId ? { ...i, read: true } : i)))
    } catch (err) {
      console.warn('Failed to mark inquiry read:', err.message)
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
          <button className="chip" onClick={() => setView('become-buyers-agent')}>
            <Users size={13} /> Offer buyer's-agent services
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
            const effectiveStatus = getEffectiveStatus(listing)
            const Icon = STATUS_ICON[effectiveStatus] || Clock
            const listingCounts = counts[listing.id] || { views: 0, inquiries: 0 }
            return (
              <div key={listing.id} className="detail-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{TYPE_LABELS[listing.type] || listing.type}</p>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 2px' }}>
                      {listing.locationText}, {listing.state} · ₦{Number(listing.price).toLocaleString()}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> {listingCounts.views} view{listingCounts.views === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className={`stamp-inline ${
                      effectiveStatus === 'active'
                        ? 'verified'
                        : effectiveStatus === 'rejected' || effectiveStatus === 'blocked' || effectiveStatus === 'expired'
                        ? 'disputed'
                        : 'unverified'
                    }`}
                  >
                    <Icon /> {effectiveStatus.replace('_', ' ')}
                  </span>
                </div>
                {listing.blockedReason && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: '0 0 8px' }}>{listing.blockedReason}</p>
                )}
                <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
                <div style={{ marginTop: 8 }}>
                  <FeeComplianceNote
                    state={listing.state}
                    transactionType={listing.transactionType}
                    agencyFeePercent={listing.agencyFeePercent}
                    dualRepresentation={listing.dualRepresentation}
                  />
                </div>

                {effectiveStatus === 'expired' && (
                  <button
                    className="chip active"
                    style={{ marginTop: 12 }}
                    onClick={() => handleRenew(listing.id)}
                    disabled={busyId === listing.id}
                  >
                    <RefreshCw size={13} /> {busyId === listing.id ? 'Renewing...' : 'Renew (30 more days)'}
                  </button>
                )}

                {['active', 'under_offer', 'let', 'sold', 'expired'].includes(listing.status) && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>Availability</label>
                    <select
                      value={effectiveStatus}
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

                <button className="chip" style={{ marginTop: 12 }} onClick={() => toggleInquiries(listing.id)}>
                  <MessageSquare size={13} /> Inquiries ({listingCounts.inquiries})
                  {expandedId === listing.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {expandedId === listing.id && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inquiries === null ? (
                      <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading...</p>
                    ) : inquiries.length === 0 ? (
                      <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>No inquiries yet.</p>
                    ) : (
                      inquiries.map((inquiry) => (
                        <div
                          key={inquiry.id}
                          style={{
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            background: inquiry.read ? 'transparent' : 'var(--teal-soft)'
                          }}
                        >
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>
                            {inquiry.buyerName} · {inquiry.buyerContact}
                          </p>
                          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{inquiry.message}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                              {new Date(inquiry.createdAt).toLocaleString()}
                            </span>
                            {!inquiry.read && (
                              <button className="chip" style={{ fontSize: 11.5 }} onClick={() => handleMarkRead(inquiry.id)}>
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
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
