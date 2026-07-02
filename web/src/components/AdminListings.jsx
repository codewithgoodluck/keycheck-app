import { useEffect, useState } from 'react'
import { Plus, ShieldAlert, ShieldCheck, ShieldX, Clock, UserCheck, Eye, MessageSquare, BadgeCheck } from 'lucide-react'
import { PROPERTY_TYPE_LABELS, SIZE_PROPERTY_TYPES, getPropertyTypeLabel } from '../data/propertyTypes.js'
import { NIGERIAN_STATES, DUAL_REP_LABELS } from '../data/verificationRules.js'
import { TITLE_DOCUMENT_LABELS, AMENITY_GROUPS } from '../data/listingFacts.js'
import {
  createListing,
  listListings,
  activateListing,
  rejectListing,
  getEffectiveStatus,
  getListingViewCount,
  setLasreraVerified,
  setCacVerified,
  setTitleDocumentVerified
} from '../lib/listingsApi.js'
import { getInquiryCount } from '../lib/inquiriesApi.js'
import VerificationBadge from './VerificationBadge.jsx'
import TrustSignals from './TrustSignals.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'
import LocationPicker from './LocationPicker.jsx'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, blocked: ShieldAlert, rejected: ShieldX, expired: ShieldX }

const EMPTY_FORM = {
  type: 'house',
  transactionType: 'rent',
  state: 'Lagos',
  locationText: '',
  price: '',
  sizeSqm: '',
  bedrooms: '',
  bathrooms: '',
  parkingSpaces: '',
  serviceCharge: '',
  amenities: [],
  titleDocumentType: 'none_yet',
  encumbranceFreeDeclared: false,
  description: '',
  listerName: '',
  listerType: 'individual',
  lasreraNumber: '',
  cacNumber: '',
  professionalIndemnityInsurance: false,
  agencyFeePercent: '',
  dualRepresentation: 'seller_only'
}

const SIZE_TYPES = SIZE_PROPERTY_TYPES
const NON_LAND_TYPES = ['house', 'apartment', 'commercial', 'estate']

// Admin-only for Milestone 1 — no lister-account system exists yet (see
// the plan this was built from). This is deliberately a moderator tool,
// not a public submission form.
export default function AdminListings() {
  const [listings, setListings] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [pin, setPin] = useState(null)
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

  function toggleAmenity(option) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(option) ? f.amenities.filter((a) => a !== option) : [...f.amenities, option]
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (
      !form.locationText.trim() ||
      !form.description.trim() ||
      !form.listerName.trim() ||
      !form.price ||
      form.agencyFeePercent === '' ||
      (SIZE_TYPES.includes(form.type) && !form.sizeSqm)
    ) return
    setSubmitting(true)
    try {
      await createListing({
        ...form,
        price: Number(form.price),
        sizeSqm: SIZE_TYPES.includes(form.type) ? Number(form.sizeSqm) : null,
        bedrooms: NON_LAND_TYPES.includes(form.type) && form.bedrooms !== '' ? Number(form.bedrooms) : null,
        bathrooms: NON_LAND_TYPES.includes(form.type) && form.bathrooms !== '' ? Number(form.bathrooms) : null,
        parkingSpaces: NON_LAND_TYPES.includes(form.type) && form.parkingSpaces !== '' ? Number(form.parkingSpaces) : null,
        serviceCharge: NON_LAND_TYPES.includes(form.type) && form.serviceCharge !== '' ? Number(form.serviceCharge) : null,
        agencyFeePercent: Number(form.agencyFeePercent),
        lasreraNumber: form.lasreraNumber.trim() || null,
        cacNumber: form.cacNumber.trim() || null,
        lat: pin ? pin[0] : null,
        lng: pin ? pin[1] : null
      })
      setForm(EMPTY_FORM)
      setPin(null)
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

  async function handleToggleLasreraVerified(listing) {
    try {
      await setLasreraVerified(listing.id, !listing.lasreraVerified)
      refresh()
    } catch (err) {
      alert('Failed to update LASRERA verification: ' + err.message)
    }
  }

  async function handleToggleCacVerified(listing) {
    try {
      await setCacVerified(listing.id, !listing.cacVerified)
      refresh()
    } catch (err) {
      alert('Failed to update CAC verification: ' + err.message)
    }
  }

  async function handleToggleTitleDocVerified(listing) {
    try {
      await setTitleDocumentVerified(listing.id, !listing.titleDocumentVerified)
      refresh()
    } catch (err) {
      alert('Failed to update title-document verification: ' + err.message)
    }
  }

  return (
    <div>
      <div className="form-card" style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 700 }}>Add a listing</p>
        <form onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="listing-type">Property type</label>
            <select id="listing-type" value={form.type} onChange={(e) => update('type', e.target.value)}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
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
            <label>Pin the location on a map (optional)</label>
            <LocationPicker value={pin} onChange={setPin} />
          </div>
          <div className="field">
            <label htmlFor="listing-price">Price (₦)</label>
            <input id="listing-price" type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} required />
          </div>
          {SIZE_TYPES.includes(form.type) && (
            <div className="field">
              <label htmlFor="listing-sizeSqm">Size (square meters)</label>
              <input
                id="listing-sizeSqm"
                type="number"
                min="0"
                value={form.sizeSqm}
                onChange={(e) => update('sizeSqm', e.target.value)}
                required
              />
            </div>
          )}
          {NON_LAND_TYPES.includes(form.type) && (
            <>
              <div className="field">
                <label htmlFor="listing-bedrooms">Bedrooms (optional)</label>
                <input id="listing-bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="listing-bathrooms">Bathrooms (optional)</label>
                <input id="listing-bathrooms" type="number" min="0" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="listing-parking">Parking spaces (optional)</label>
                <input id="listing-parking" type="number" min="0" value={form.parkingSpaces} onChange={(e) => update('parkingSpaces', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="listing-serviceCharge">Annual service charge, ₦ (optional)</label>
                <input id="listing-serviceCharge" type="number" min="0" value={form.serviceCharge} onChange={(e) => update('serviceCharge', e.target.value)} />
              </div>
            </>
          )}
          <div className="field">
            <label>Features (optional)</label>
            {AMENITY_GROUPS.map((group) => (
              <div key={group.key} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', margin: '0 0 6px' }}>{group.label}</p>
                <div className="chip-row" style={{ marginTop: 0 }}>
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`chip ${form.amenities.includes(option) ? 'active' : ''}`}
                      onClick={() => toggleAmenity(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="field">
            <label htmlFor="listing-titleDoc">Title document (optional)</label>
            <select id="listing-titleDoc" value={form.titleDocumentType} onChange={(e) => update('titleDocumentType', e.target.value)}>
              {Object.entries(TITLE_DOCUMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {form.titleDocumentType !== 'none_yet' && (
            <label className="field-checkbox">
              <input
                type="checkbox"
                checked={form.encumbranceFreeDeclared}
                onChange={(e) => update('encumbranceFreeDeclared', e.target.checked)}
              />
              <span>No known encumbrance, lien, or dispute.</span>
            </label>
          )}
          <div className="field">
            <label htmlFor="listing-listerType">Lister type</label>
            <select id="listing-listerType" value={form.listerType} onChange={(e) => update('listerType', e.target.value)}>
              <option value="individual">Individual</option>
              <option value="agency">Agency / company</option>
            </select>
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

          <div className="field">
            <label htmlFor="listing-cac">CAC registration number (optional)</label>
            <input
              id="listing-cac"
              type="text"
              value={form.cacNumber}
              onChange={(e) => update('cacNumber', e.target.value)}
            />
          </div>

          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={form.professionalIndemnityInsurance}
              onChange={(e) => update('professionalIndemnityInsurance', e.target.checked)}
            />
            <span>Carries professional indemnity insurance (voluntary, not legally required in Nigeria)</span>
          </label>

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
                      {getPropertyTypeLabel(listing.type)}: {listing.listerName}
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
                <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
                <TrustSignals
                  cacNumber={listing.cacNumber}
                  cacVerified={listing.cacVerified}
                  professionalIndemnityInsurance={listing.professionalIndemnityInsurance}
                  titleDocumentType={listing.titleDocumentType}
                  titleDocumentVerified={listing.titleDocumentVerified}
                  encumbranceFreeDeclared={listing.encumbranceFreeDeclared}
                />
                <div style={{ marginTop: 8 }}>
                  <FeeComplianceNote
                    state={listing.state}
                    transactionType={listing.transactionType}
                    agencyFeePercent={listing.agencyFeePercent}
                    dualRepresentation={listing.dualRepresentation}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {listing.state === 'Lagos' && listing.lasreraNumber && (
                    <button
                      className={`chip ${listing.lasreraVerified ? 'active' : ''}`}
                      style={{ fontSize: 12 }}
                      onClick={() => handleToggleLasreraVerified(listing)}
                    >
                      <BadgeCheck size={13} />
                      {listing.lasreraVerified ? 'LASRERA checked — mark unchecked' : 'Mark LASRERA # as checked'}
                    </button>
                  )}
                  {listing.cacNumber && (
                    <button
                      className={`chip ${listing.cacVerified ? 'active' : ''}`}
                      style={{ fontSize: 12 }}
                      onClick={() => handleToggleCacVerified(listing)}
                    >
                      <BadgeCheck size={13} />
                      {listing.cacVerified ? 'CAC checked — mark unchecked' : 'Mark CAC # as checked'}
                    </button>
                  )}
                  {listing.titleDocumentType && listing.titleDocumentType !== 'none_yet' && (
                    <button
                      className={`chip ${listing.titleDocumentVerified ? 'active' : ''}`}
                      style={{ fontSize: 12 }}
                      onClick={() => handleToggleTitleDocVerified(listing)}
                    >
                      <BadgeCheck size={13} />
                      {listing.titleDocumentVerified ? 'Title doc checked — mark unchecked' : 'Mark title document as checked'}
                    </button>
                  )}
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
