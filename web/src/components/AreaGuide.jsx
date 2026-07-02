import { ArrowLeft, Home, MapPin } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import ListingCard from './ListingCard.jsx'
import { areaOf } from '../lib/notifications.js'

// Data page, not editorial content — shows KeyCheck's own aggregated
// report/listing data for an area, nothing asserted that isn't backed by
// KeyCheck's own records (see the plan this was built from). Mirrors
// AgentProfile.jsx's grouping shape, but groups by areaOf() instead of
// an exact agentName match, and receives `listings` as a prop directly
// (already subscribed app-wide) rather than a one-off fetch.
export default function AreaGuide({ reports, listings, name, setView, savedIds, onToggleSave }) {
  const target = (name || '').trim().toLowerCase()
  const matchingReports = reports.filter((r) => areaOf(r) === target)
  const matchingListings = listings.filter((l) => areaOf(l) === target && l.status === 'active')

  const flags = matchingReports.filter((r) => r.kind !== 'endorsement')
  const endorsements = matchingReports.filter((r) => r.kind === 'endorsement')
  const verifiedCount = flags.filter((r) => r.status === 'verified').length
  const disputedCount = flags.filter((r) => r.status === 'disputed').length

  const hasAnything = matchingReports.length > 0 || matchingListings.length > 0

  return (
    <>
      <button className="detail-back" onClick={() => setView('home')}>
        <ArrowLeft size={15} /> Back to search
      </button>

      <div className="saved-header">
        <h1>
          <MapPin size={20} style={{ verticalAlign: -3, marginRight: 6 }} />
          {name}
        </h1>
        <p>
          {matchingReports.length} report{matchingReports.length === 1 ? '' : 's'} and{' '}
          {matchingListings.length} active listing{matchingListings.length === 1 ? '' : 's'} for this area on
          KeyCheck. This is a data summary, not a written guide — it only shows what's actually been
          reported or listed here.
        </p>
      </div>

      <div className="stats-bar">
        <div className="stat-card"><div className="num">{matchingListings.length}</div><div className="label">Active listings</div></div>
        <div className="stat-card"><div className="num">{endorsements.length}</div><div className="label">Clean records</div></div>
        <div className="stat-card"><div className="num">{flags.length}</div><div className="label">Flagged reports</div></div>
        <div className="stat-card"><div className="num">{verifiedCount}</div><div className="label">Court-verified</div></div>
        <div className="stat-card"><div className="num">{disputedCount}</div><div className="label">In court</div></div>
      </div>

      {matchingListings.length > 0 && (
        <>
          <div className="results-meta"><span><Home size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Active listings</span></div>
          <div className="listing-grid" style={{ marginBottom: 24 }}>
            {matchingListings.map((l) => (
              <ListingCard key={l.id} listing={l} onClick={() => setView('listing-detail', l)} />
            ))}
          </div>
        </>
      )}

      {endorsements.length > 0 && (
        <>
          <div className="results-meta"><span>Clean records</span></div>
          <div className="report-list" style={{ marginBottom: 24 }}>
            {endorsements.map((r) => (
              <ReportCard key={r.id} report={r} onClick={() => setView('detail', r)} saved={savedIds.includes(r.id)} onToggleSave={onToggleSave} />
            ))}
          </div>
        </>
      )}

      {flags.length > 0 && (
        <>
          <div className="results-meta"><span>Flagged reports</span></div>
          <div className="report-list" style={{ marginBottom: 24 }}>
            {flags.map((r) => (
              <ReportCard key={r.id} report={r} onClick={() => setView('detail', r)} saved={savedIds.includes(r.id)} onToggleSave={onToggleSave} />
            ))}
          </div>
        </>
      )}

      {!hasAnything && (
        <div className="empty-state">
          <MapPin size={28} />
          <p>No reports or listings for this area yet.</p>
        </div>
      )}
    </>
  )
}
