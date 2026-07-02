import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, FileText, MessageCircle, Home, Clock, GitCompare, Share2, Bookmark, Flag } from 'lucide-react'
import { getPropertyTypeLabel } from '../data/propertyTypes.js'
import VerificationBadge from './VerificationBadge.jsx'
import TrustSignals from './TrustSignals.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'
import MarketPriceIndicator from './MarketPriceIndicator.jsx'
import { getEffectiveStatus, logListingView } from '../lib/listingsApi.js'
import { getCompareIds, isComparing, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
import { isListingSaved, toggleSavedListing } from '../lib/listingWatchlist.js'
import { flagListing, FLAG_REASON_LABELS } from '../lib/listingFlagsApi.js'
import { areaOf } from '../lib/notifications.js'
import { showToast } from '../lib/toast.js'
import InquiryForm from './InquiryForm.jsx'

const SIZE_TYPES = ['land', 'estate']

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

  return (
    <div className="theme-market">
      <button className="detail-back" onClick={() => setView('listings')}>
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

        {listing.photoUrl && (
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16 }}>
            <img src={listing.photoUrl} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div className="detail-section">
          <h4><MapPin /> Location</h4>
          <p>{listing.locationText}, {listing.state}</p>
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

        <div className="detail-section">
          <h4><Home /> Verification</h4>
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
          <TrustSignals
            cacNumber={listing.cacNumber}
            cacVerified={listing.cacVerified}
            professionalIndemnityInsurance={listing.professionalIndemnityInsurance}
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

        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="submit-btn"
            style={{ textDecoration: 'none', display: 'inline-flex', marginBottom: 20 }}
          >
            <MessageCircle size={15} /> Contact {listing.listerName || 'lister'} on WhatsApp
          </a>
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
