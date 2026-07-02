import { MapPin, Home, GitCompare } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import VerificationBadge from './VerificationBadge.jsx'

// Mirrors ReportCard.jsx's shape for the browse results list, including
// its save-button pattern (stopPropagation + icon toggle) for the new
// compare button.
export default function ListingCard({ listing, onClick, comparing, onToggleCompare }) {
  return (
    <div className="report-card" onClick={onClick}>
      <div className="card-icon" style={{ padding: 0, overflow: 'hidden' }}>
        {listing.photoUrl ? (
          <img src={listing.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Home size={20} />
        )}
      </div>
      <div className="card-body">
        <div className="card-top-row">
          <div>
            <h3>
              {TYPE_LABELS[listing.type] || listing.type} · ₦{Number(listing.price).toLocaleString()}
            </h3>
            <p className="desc">{listing.description}</p>
          </div>
          {onToggleCompare && (
            <button
              className={`save-btn ${comparing ? 'saved' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleCompare(listing.id)
              }}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            >
              <GitCompare size={18} />
            </button>
          )}
        </div>
        <div className="card-meta">
          <span>
            <MapPin /> {listing.locationText}, {listing.state}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} />
        </div>
      </div>
    </div>
  )
}
