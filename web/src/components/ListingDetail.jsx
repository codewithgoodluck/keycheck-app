import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, FileText, MessageCircle, Phone, Home, Clock, GitCompare, Share2, Bookmark, Flag, Users, ListChecks } from 'lucide-react'
import { getPropertyTypeLabel } from '../data/propertyTypes.js'
import { AMENITY_GROUPS } from '../data/listingFacts.js'
import VerificationBadge from './VerificationBadge.jsx'
import TrustSignals from './TrustSignals.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'
import MarketPriceIndicator from './MarketPriceIndicator.jsx'
import { getEffectiveStatus, logListingView } from '../lib/listingsApi.js'
import { getCompareIds, isComparing, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
import { isListingSaved, toggleSavedListing } from '../lib/listingWatchlist.js'
import { flagListing, FLAG_REASON_LABELS } from '../lib/listingFlagsApi.js'
import { addRecentlyViewed } from '../lib/recentlyViewed.js'
import { areaOf } from '../lib/notifications.js'
import { timeAgo } from '../lib/time.js'
import { showToast } from '../lib/toast.js'
import InquiryForm from './InquiryForm.jsx'

const SIZE_TYPES = ['land', 'estate']
const NON_LAND_TYPES = ['house', 'apartment', 'commercial', 'estate']

function FactItem({ label, value }) {
  return (
    <div style={{ background: 'var(--paper)', borderRadius: 10, padding: '10px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  )
}

// Mirrors ReportDetail.jsx's overall shape, deliberately slimmer — no
// confirm/reply/dispute flows, those are report-specific. Contact is
// WhatsApp plus the lightweight InquiryForm below, shown side by side —
// a choice, not one replacing the other.
export default function ListingDetail({ listing, listings, setView }) {
  // Hooks must run unconditionally (before the early return below), so
  // the "no listing" guard lives inside each effect body instead.
  useEffect(() => {
    if (!listing) return
    logListingView(listing.id, listing.listerId)
    addRecentlyViewed(listing.id)
  }, [listing?.id])

  const [activePhoto, setActivePhoto] = useState(0)
  useEffect(() => {
    setActivePhoto(0)
  }, [listing?.id])

  const [comparing, setComparing] = useState(false)
  useEffect(() => {
    if (listing) setComparing(isComparing(listing.id))
  }, [listing?.id])

  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (listing) setSaved(isListingSaved(listing.id))
  }, [listing?.id])

  function handleToggleCompare() {
    const current = getCompareIds()
    if (!current.includes(listing.id) && current.length >= MAX_COMPARE) {
      alert(`You can compare up to ${MAX_COMPARE} listings at a time. Remove one first.`)
      return
    }
    toggleCompare(listing.id)
    setComparing((c) => !c)
  }

  function handleToggleSave() {
    toggleSavedListing(listing.id)
    setSaved((s) => !s)
  }

  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagReason, setFlagReason] = useState('fake')
  const [flagNote, setFlagNote] = useState('')
  const [flagSubmitting, setFlagSubmitting] = useState(false)
  const [flagSubmitted, setFlagSubmitted] = useState(false)

  async function handleSubmitFlag(e) {
    e.preventDefault()
    setFlagSubmitting(true)
    try {
      await flagListing(listing.id, flagReason, flagNote)
      setFlagSubmitted(true)
      setShowFlagForm(false)
    } catch (err) {
      alert('Failed to report this listing: ' + err.message)
    } finally {
      setFlagSubmitting(false)
    }
  }

  // Clean /listing/:id URL, not the ?listing= query form — routes
  // through the dynamic-OG serverless function (web/api/og.js) so the
  // shared link shows this listing's real title/price/photo when pasted
  // into WhatsApp/Twitter/Facebook, not the generic site card.
  async function handleShare() {
    const url = `${window.location.origin}/listing/${listing.id}`
    const shareData = { title: 'KeyCheck listing', text: `${getPropertyTypeLabel(listing.type)} — ₦${Number(listing.price).toLocaleString()}`, url }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled, no-op
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard', 'success')
    }
  }

  if (!listing) {
    return (
      <div className="empty-state">
        <p>Listing not found.</p>
        <button onClick={() => setView('listings')}>Back to listings</button>
      </div>
    )
  }

  const waNumber = (listing.listerPhone || '').replace(/[^0-9]/g, '')
  const isExpired = getEffectiveStatus(listing) === 'expired'
  const photos = listing.photoUrls?.length > 0 ? listing.photoUrls : listing.photoUrl ? [listing.photoUrl] : []
  const waMessage = `Hi, I'm interested in your listing: ${getPropertyTypeLabel(listing.type)} in ${listing.locationText} — is it still available?`

  return (
    <div className="theme-market">
      <div className="page-banner page-banner-market" style={{ padding: '20px 20px 16px' }}>
        <p className="eyebrow">
          <Home size={13} /> Listing
        </p>
      </div>

      <button className="detail-back" onClick={() => setView('listings')} style={{ marginTop: 0 }}>
        <ArrowLeft size={15} /> Back to listings
      </button>

      {isExpired && (
        <div className="fact-box" style={{ marginBottom: 16, background: 'var(--red-soft)' }}>
          <Clock size={18} color="var(--red)" />
          <div>
            <strong>This listing has expired.</strong> It's no longer being actively promoted by the
            lister — the details below may be out of date. Contact the lister to confirm availability.
          </div>
        </div>
      )}

      <div className="detail-card">
        <div className="detail-header">
          <div>
            <p className="card-id">#{listing.id}</p>
            <h1>
              {getPropertyTypeLabel(listing.type)} — ₦{Number(listing.price).toLocaleString()}
            </h1>
          </div>
          <div className="detail-actions">
            <button className="icon-btn" onClick={handleShare} aria-label="Share">
              <Share2 size={17} />
            </button>
            <button
              className={`icon-btn ${saved ? 'saved' : ''}`}
              onClick={handleToggleSave}
              aria-label={saved ? 'Remove from saved' : 'Save listing'}
            >
              <Bookmark size={17} />
            </button>
            <button
              className={`icon-btn ${comparing ? 'saved' : ''}`}
              onClick={handleToggleCompare}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            >
              <GitCompare size={17} />
            </button>
          </div>
        </div>

        {photos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <img src={photos[activePhoto]} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
              {photos.length > 1 && (
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 999
                  }}
                >
                  {activePhoto + 1}/{photos.length}
                </span>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 10,
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: i === activePhoto ? '2px solid var(--coral)' : '2px solid transparent',
                      opacity: i === activePhoto ? 1 : 0.75
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="detail-section">
          <h4><MapPin /> Location</h4>
          <p>{listing.locationText}, {listing.state}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Listed {timeAgo(listing.createdAt)}
          </p>
          <button
            className="chip"
            style={{ marginTop: 8 }}
            onClick={() => setView('area-guide', areaOf(listing))}
          >
            See other activity in {listing.locationText?.split(',')[0].trim()}
          </button>
        </div>

        <div className="detail-section">
          <h4><FileText /> Description</h4>
          <p>{listing.description}</p>
        </div>

        {(NON_LAND_TYPES.includes(listing.type) || SIZE_TYPES.includes(listing.type)) && (
          <div className="detail-section">
            <h4><ListChecks /> Facts &amp; specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {listing.bedrooms > 0 && <FactItem label="Bedrooms" value={listing.bedrooms} />}
              {listing.bathrooms > 0 && <FactItem label="Bathrooms" value={listing.bathrooms} />}
              {listing.parkingSpaces > 0 && <FactItem label="Parking" value={listing.parkingSpaces} />}
              {SIZE_TYPES.includes(listing.type) && listing.sizeSqm > 0 && <FactItem label="Size" value={`${listing.sizeSqm} m²`} />}
              {SIZE_TYPES.includes(listing.type) && listing.sizeSqm > 0 && (
                <FactItem label="Price / m²" value={`₦${Math.round(listing.price / listing.sizeSqm).toLocaleString()}`} />
              )}
              {listing.serviceCharge > 0 && <FactItem label="Service charge / yr" value={`₦${Number(listing.serviceCharge).toLocaleString()}`} />}
              <FactItem label="For" value={listing.transactionType === 'rent' ? 'Rent' : 'Sale'} />
            </div>
          </div>
        )}

        {listing.amenities?.length > 0 && (
          <div className="detail-section">
            <h4><ListChecks /> Features</h4>
            {AMENITY_GROUPS.map((group) => {
              const present = group.options.filter((o) => listing.amenities.includes(o))
              if (present.length === 0) return null
              return (
                <div key={group.key} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-faint)', margin: '0 0 6px' }}>
                    {group.label}
                  </p>
                  <div className="chip-row" style={{ marginTop: 0 }}>
                    {present.map((o) => (
                      <span key={o} className="chip" style={{ cursor: 'default' }}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="detail-section">
          <h4><Home /> Verification</h4>
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
          <TrustSignals
            cacNumber={listing.cacNumber}
            cacVerified={listing.cacVerified}
            professionalIndemnityInsurance={listing.professionalIndemnityInsurance}
            titleDocumentType={listing.titleDocumentType}
            titleDocumentVerified={listing.titleDocumentVerified}
            encumbranceFreeDeclared={listing.encumbranceFreeDeclared}
          />
          <div style={{ marginTop: 10 }}>
            <FeeComplianceNote
              state={listing.state}
              transactionType={listing.transactionType}
              agencyFeePercent={listing.agencyFeePercent}
              dualRepresentation={listing.dualRepresentation}
            />
          </div>
        </div>

        {SIZE_TYPES.includes(listing.type) && listing.sizeSqm > 0 && (
          <div className="detail-section">
            <h4><FileText /> Market price indicator</h4>
            <MarketPriceIndicator listing={listing} listings={listings} />
          </div>
        )}

        {listing.listerName && (
          <div className="detail-section">
            <h4><Users /> Listed by</h4>
            <p>
              {listing.listerName}
              {listing.listerType === 'agency' && (
                <span className="chip" style={{ marginLeft: 8, cursor: 'default', fontSize: 11 }}>
                  Agency
                </span>
              )}
            </p>
            <button className="chip" style={{ marginTop: 4 }} onClick={() => setView('profile', listing.listerName)}>
              View {listing.listerName}'s KeyCheck profile
            </button>
          </div>
        )}

        {waNumber && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="submit-btn"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              <MessageCircle size={15} /> WhatsApp {listing.listerName || 'lister'}
            </a>
            <a href={`tel:${waNumber}`} className="chip" style={{ textDecoration: 'none', fontSize: 13.5, padding: '10px 18px' }}>
              <Phone size={14} /> Call
            </a>
          </div>
        )}
      </div>

      {listing.listerId ? (
        <div style={{ marginTop: 16 }}>
          <InquiryForm listing={listing} />
        </div>
      ) : (
        waNumber && (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 }}>
            This listing was created directly by a moderator and has no lister account attached, so
            in-app messaging isn't available for it — use WhatsApp above to get in touch.
          </p>
        )
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        {flagSubmitted ? (
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            Thanks — this listing has been flagged for a moderator to review.
          </p>
        ) : showFlagForm ? (
          <form onSubmit={handleSubmitFlag} className="form-card" style={{ textAlign: 'left' }}>
            <div className="field">
              <label htmlFor="flag-reason">What's wrong with this listing?</label>
              <select id="flag-reason" value={flagReason} onChange={(e) => setFlagReason(e.target.value)}>
                {Object.entries(FLAG_REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="flag-note">More detail (optional)</label>
              <textarea id="flag-note" value={flagNote} onChange={(e) => setFlagNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="submit-btn" type="submit" disabled={flagSubmitting}>
                <Flag size={14} /> {flagSubmitting ? 'Submitting...' : 'Submit report'}
              </button>
              <button type="button" className="chip" onClick={() => setShowFlagForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="chip" onClick={() => setShowFlagForm(true)} style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            <Flag size={12} /> Report this listing (fake, duplicate, or already taken)
          </button>
        )}
      </div>
    </div>
  )
}
