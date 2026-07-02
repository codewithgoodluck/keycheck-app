import { useEffect, useState } from 'react'
import { Plus, ShieldAlert, ShieldCheck, ShieldX, Clock, UserCheck } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { createListing, listListings, activateListing, rejectListing } from '../lib/listingsApi.js'
import VerificationBadge from './VerificationBadge.jsx'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, blocked: ShieldAlert, rejected: ShieldX }

const EMPTY_FORM = {
  type: 'house_agent',
  state: 'Lagos',
  locationText: '',
  price: '',
  description: '',
  listerName: '',
  lasreraNumber: ''
}

// Admin-only for Milestone 1 — no lister-account system exists yet (see
// the plan this was built from). This is deliberately a moderator tool,
// not a public submission form.
export default function AdminListings() {
  const [listings, setListings] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    refresh()
  }, [])

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
    if (!form.locationText.trim() || !form.description.trim() || !form.listerName.trim() || !form.price) return
    setSubmitting(true)
    try {
      await createListing({
        ...form,
        price: Number(form.price),
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
            const Icon = STATUS_ICON[listing.status] || Clock
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
                  </div>
                  <span
                    className={`stamp-inline ${
                      listing.status === 'active' ? 'verified' : listing.status === 'blocked' || listing.status === 'rejected' ? 'disputed' : 'unverified'
                    }`}
                  >
                    <Icon /> {listing.status}
                  </span>
                </div>
                {listing.blockedReason && (
                  <p style={{ fontSize: 12.5, color: 'var(--red)', margin: '0 0 8px' }}>{listing.blockedReason}</p>
                )}
                <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} />
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
