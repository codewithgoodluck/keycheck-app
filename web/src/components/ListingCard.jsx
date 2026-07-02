import { MapPin, Home } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import VerificationBadge from './VerificationBadge.jsx'

// Mirrors ReportCard.jsx's shape for the browse results list.
export default function ListingCard({ listing, onClick }) {
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
