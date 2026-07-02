import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, FileText, MessageCircle, Home, Clock, GitCompare } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import VerificationBadge from './VerificationBadge.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'
import MarketPriceIndicator from './MarketPriceIndicator.jsx'
import { getEffectiveStatus, logListingView } from '../lib/listingsApi.js'
import { getCompareIds, isComparing, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
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

  function handleToggleCompare() {
    const current = getCompareIds()
    if (!current.includes(listing.id) && current.length >= MAX_COMPARE) {
      alert(`You can compare up to ${MAX_COMPARE} listings at a time. Remove one first.`)
      return
    }
    toggleCompare(listing.id)
    setComparing((c) => !c)
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
    <>
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
              {TYPE_LABELS[listing.type] || listing.type} — ₦{Number(listing.price).toLocaleString()}
            </h1>
          </div>
          <div className="detail-actions">
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
        </div>

        <div className="detail-section">
          <h4><FileText /> Description</h4>
          <p>{listing.description}</p>
        </div>

        <div className="detail-section">
          <h4><Home /> Verification</h4>
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} />
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

      <div style={{ marginTop: 16 }}>
        <InquiryForm listing={listing} />
      </div>
    </>
  )
}
