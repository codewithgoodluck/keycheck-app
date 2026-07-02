import { useEffect, useState } from 'react'
import { Plus, ShieldAlert, ShieldCheck, ShieldX, Clock, UserCheck, Eye, MessageSquare } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import { NIGERIAN_STATES, DUAL_REP_LABELS } from '../data/verificationRules.js'
import { createListing, listListings, activateListing, rejectListing, getEffectiveStatus, getListingViewCount } from '../lib/listingsApi.js'
import { getInquiryCount } from '../lib/inquiriesApi.js'
import VerificationBadge from './VerificationBadge.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, blocked: ShieldAlert, rejected: ShieldX, expired: ShieldX }

const EMPTY_FORM = {
  type: 'house_agent',
  transactionType: 'rent',
  state: 'Lagos',
  locationText: '',
  price: '',
  description: '',
  listerName: '',
  lasreraNumber: '',
  agencyFeePercent: '',
  dualRepresentation: 'seller_only'
}

// Admin-only for Milestone 1 — no lister-account system exists yet (see
// the plan this was built from). This is deliberately a moderator tool,
// not a public submission form.
export default function AdminListings() {
  const [listings, setListings] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [counts, setCounts] = useState({}) // listingId -> { views, inquiries }

  useEffect(() => {
    refresh()
  }, [])

  // Legacy admin-direct-created listings (this form's own create path)
  // have no listerId at all, so counting is skipped for those — a query
  // filtered on an undefined listerId would either throw or just never
  // match, not a meaningful "0".
  useEffect(() => {
    if (!listings || listings.length === 0) return
    const withLister = listings.filter((l) => l.listerId)
    if (withLister.length === 0) return
    let cancelled = false
    Promise.all(
      withLister.map(async (l) => {
        const [views, inquiryCount] = await Promise.all([
          getListingViewCount(l.id, l.listerId).catch(() => 0),
          getInquiryCount(l.id, l.listerId).catch(() => 0)
        ])
        return [l.id, { views, inquiries: inquiryCount }]
      })
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [listings])

  function refresh() {
    listListings()
      .then(setListings)
      .catch((err) => {
        console.warn('Failed to load listings:', err.message)
        setListings([])
      })
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (
      !form.locationText.trim() ||
      !form.description.trim() ||
      !form.listerName.trim() ||
      !form.price ||
      form.agencyFeePercent === ''
    ) return
    setSubmitting(true)
    try {
      await createListing({
        ...form,
        price: Number(form.price),
        agencyFeePercent: Number(form.agencyFeePercent),
        lasreraNumber: form.lasreraNumber.trim() || null
      })
      setForm(EMPTY_FORM)
      refresh()
    } catch (err) {
      setError('Failed to create listing: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleActivate(listing) {
    try {
      const result = await activateListing(listing.id, listing.listerName)
      if (!result.activated) {
        alert(`Not activated: "${listing.listerName}" has an active disputed/verified fraud report — the listing was rejected instead.`)
      }
      refresh()
    } catch (err) {
      alert('Failed to activate: ' + err.message)
    }
  }

  async function handleReject(id) {
    const reason = prompt('Reason for rejecting this listing (shown to the lister):')
    if (reason === null) return
    try {
      await rejectListing(id, reason)
      refresh()
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    }
  }

  return (
    <div>
      <div className="form-card" style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 700 }}>Add a listing</p>
        <form onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="listing-type">Type</label>
            <select id="listing-type" value={form.type} onChange={(e) => update('type', e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="listing-transactionType">For sale or for rent?</label>
            <select
              id="listing-transactionType"
              value={form.transactionType}
              onChange={(e) => update('transactionType', e.target.value)}
            >
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="listing-state">State</label>
            <select id="listing-state" value={form.state} onChange={(e) => update('state', e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="listing-location">Location</label>
            <input
              id="listing-location"
              type="text"
              value={form.locationText}
              onChange={(e) => update('locationText', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="listing-price">Price (₦)</label>
            <input id="listing-price" type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="listing-agencyFee">Agency fee (% of {form.transactionType === 'rent' ? 'total rent' : 'sale price'})</label>
            <input
              id="listing-agencyFee"
              type="number"
              min="0"
              step="0.1"
              value={form.agencyFeePercent}
              onChange={(e) => update('agencyFeePercent', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="listing-dualRep">Represents</label>
            <select id="listing-dualRep" value={form.dualRepresentation} onChange={(e) => update('dualRepresentation', e.target.value)}>
              {Object.entries(DUAL_REP_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="listing-description">Description</label>
            <textarea id="listing-description" value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="listing-lister">Lister name</label>
            <input
              id="listing-lister"
              type="text"
              placeholder="Agent, landlord, or company name — checked against fraud reports automatically"
              value={form.listerName}
              onChange={(e) => update('listerName', e.target.value)}
              required
            />
          </div>
          {form.state === 'Lagos' && (
            <div className="field">
              <label htmlFor="listing-lasrera">LASRERA registration number (optional)</label>
              <input
                id="listing-lasrera"
                type="text"
                value={form.lasreraNumber}
                onChange={(e) => update('lasreraNumber', e.target.value)}
              />
            </div>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

          <button className="submit-btn" type="submit" disabled={submitting}>
            <Plus size={15} /> {submitting ? 'Creating...' : 'Create listing'}
          </button>
        </form>
      </div>

      <div className="report-list">
        {listings === null ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p>No listings yet.</p>
          </div>
        ) : (
          listings.map((listing) => {
            const effectiveStatus = getEffectiveStatus(listing)
            const Icon = STATUS_ICON[effectiveStatus] || Clock
            const listingCounts = counts[listing.id]
            return (
              <div key={listing.id} className="detail-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {TYPE_LABELS[listing.type] || listing.type}: {listing.listerName}
                      {listing.listerId && (
                        <span title="Self-serve (lister account)" style={{ display: 'inline-flex', color: 'var(--ink-faint)' }}>
                          <UserCheck size={13} />
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                      {listing.locationText}, {listing.state} · ₦{Number(listing.price).toLocaleString()}
                    </p>
                    {listingCounts && (
                      <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {listingCounts.views}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {listingCounts.inquiries}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className={`stamp-inline ${
                      effectiveStatus === 'active'
                        ? 'verified'
                        : effectiveStatus === 'blocked' || effectiveStatus === 'rejected' || effectiveStatus === 'expired'
                        ? 'disputed'
                        : 'unverified'
                    }`}
                  >
                    <Icon /> {effectiveStatus}
                  </span>
                </div>
                {listing.blockedReason && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: '0 0 8px' }}>{listing.blockedReason}</p>
                )}
                <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} />
                <div style={{ marginTop: 8 }}>
                  <FeeComplianceNote
                    state={listing.state}
                    transactionType={listing.transactionType}
                    agencyFeePercent={listing.agencyFeePercent}
                    dualRepresentation={listing.dualRepresentation}
                  />
                </div>
                {listing.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="chip" onClick={() => handleActivate(listing)}>
                      Activate (make publicly visible)
                    </button>
                    <button className="chip" onClick={() => handleReject(listing.id)}>
                      Reject
                    </button>
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
