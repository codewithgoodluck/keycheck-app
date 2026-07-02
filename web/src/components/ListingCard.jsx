import { MapPin, Home, GitCompare, Bookmark, Star } from 'lucide-react'
import { getPropertyTypeLabel } from '../data/propertyTypes.js'
import VerificationBadge from './VerificationBadge.jsx'

// Mirrors ReportCard.jsx's shape for the browse results list, including
// its save-button pattern (stopPropagation + icon toggle) for both the
// compare and the bookmark buttons. reviewAggregate is optional — only
// Market.jsx's results feed passes it (see lib/reviewsApi.js's
// getReviewAggregate), since fetching per-lister review stats for every
// card isn't worth it on the plain browse list.
export default function ListingCard({ listing, onClick, comparing, onToggleCompare, saved, onToggleSave, reviewAggregate }) {
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
              {getPropertyTypeLabel(listing.type)} · ₦{Number(listing.price).toLocaleString()}
            </h3>
            <p className="desc">{listing.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {onToggleSave && (
              <button
                className={`save-btn ${saved ? 'saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSave(listing.id)
                }}
                aria-label={saved ? 'Remove from saved' : 'Save listing'}
              >
                <Bookmark size={18} />
              </button>
            )}
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
        </div>
        <div className="card-meta">
          <span>
            <MapPin /> {listing.locationText}, {listing.state}
          </span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
          {reviewAggregate?.count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--ink-soft)' }}>
              <Star size={12} fill="currentColor" /> {reviewAggregate.average.toFixed(1)} ({reviewAggregate.count})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
