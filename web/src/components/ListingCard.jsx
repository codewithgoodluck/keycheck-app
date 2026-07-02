import { MapPin, Home, GitCompare, Bookmark, Star, Clock } from 'lucide-react'
import { getPropertyTypeLabel } from '../data/propertyTypes.js'
import { timeAgo } from '../lib/time.js'
import VerificationBadge from './VerificationBadge.jsx'

const SIZE_TYPES = ['land', 'estate']

// Photo-forward, its own .listing-card styling (not ReportCard.jsx's
// .report-card) — a listing is a place someone might actually want to
// live in, not a fraud-status record, so the card leads with the photo
// rather than a small icon chip. reviewAggregate is optional — only
// Market.jsx's results feed passes it (see lib/reviewsApi.js's
// getReviewAggregate), since fetching per-lister review stats for every
// card isn't worth it on the plain browse list.
export default function ListingCard({ listing, onClick, comparing, onToggleCompare, saved, onToggleSave, reviewAggregate }) {
  const photos = listing.photoUrls?.length > 0 ? listing.photoUrls : listing.photoUrl ? [listing.photoUrl] : []
  const pricePerSqm = SIZE_TYPES.includes(listing.type) && listing.sizeSqm > 0 ? Math.round(listing.price / listing.sizeSqm) : null

  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-card-photo">
        {photos[0] ? (
          <img src={photos[0]} alt="" />
        ) : (
          <Home size={30} />
        )}
        <span className="listing-card-price-tag">₦{Number(listing.price).toLocaleString()}</span>
        {photos.length > 1 && <span className="listing-card-photo-count">1/{photos.length}</span>}
        <div className="listing-card-photo-actions">
          {onToggleSave && (
            <button
              className={`listing-card-icon-btn ${saved ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave(listing.id)
              }}
              aria-label={saved ? 'Remove from saved' : 'Save listing'}
            >
              <Bookmark size={16} />
            </button>
          )}
          {onToggleCompare && (
            <button
              className={`listing-card-icon-btn ${comparing ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleCompare(listing.id)
              }}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            >
              <GitCompare size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="listing-card-body">
        <h3>
          {getPropertyTypeLabel(listing.type)}
          {listing.listerType === 'agency' && <span className="listing-card-agency-tag">Agency</span>}
        </h3>
        <p className="listing-card-desc">{listing.description}</p>
        <p className="listing-card-meta">
          <MapPin size={13} /> {listing.locationText}, {listing.state}
        </p>
        {pricePerSqm && <p className="listing-card-meta">₦{pricePerSqm.toLocaleString()}/m²</p>}
        {listing.createdAt && (
          <p className="listing-card-meta">
            <Clock size={13} /> Listed {timeAgo(listing.createdAt)}
          </p>
        )}
        <div className="listing-card-badges">
          <VerificationBadge state={listing.state} lasreraNumber={listing.lasreraNumber} lasreraVerified={listing.lasreraVerified} />
          {reviewAggregate?.count > 0 && (
            <span className="listing-card-rating">
              <Star size={12} fill="currentColor" /> {reviewAggregate.average.toFixed(1)} ({reviewAggregate.count})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
