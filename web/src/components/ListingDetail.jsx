import { ArrowLeft, MapPin, FileText, MessageCircle, Home, Clock } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import VerificationBadge from './VerificationBadge.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'
import { getEffectiveStatus } from '../lib/listingsApi.js'
import InquiryForm from './InquiryForm.jsx'

// Mirrors ReportDetail.jsx's overall shape, deliberately slimmer — no
// confirm/reply/dispute flows, those are report-specific. Contact is
// WhatsApp plus the lightweight InquiryForm below, shown side by side —
// a choice, not one replacing the other.
export default function ListingDetail({ listing, setView }) {
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
