import { useState } from 'react'
import { Bookmark, Eye, X, Home } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import ListingCard from './ListingCard.jsx'
import { getWatchedTerms, removeWatch } from '../lib/watches.js'
import { getSavedListingIds, toggleSavedListing } from '../lib/listingWatchlist.js'

export default function SavedReports({ reports, savedIds, setView, onToggleSave, listings = [] }) {
  const saved = reports.filter((r) => savedIds.includes(r.id))
  const [watchedTerms, setWatchedTerms] = useState(() => getWatchedTerms())
  const [savedListingIds, setSavedListingIds] = useState(() => getSavedListingIds())
  const savedListings = listings.filter((l) => savedListingIds.includes(l.id))

  function handleToggleSaveListing(id) {
    setSavedListingIds(toggleSavedListing(id))
  }

  function handleRemoveWatch(term) {
    setWatchedTerms(removeWatch(term))
  }

  return (
    <>
      <div className="saved-header">
        <h1>Keep an eye on what matters to you.</h1>
        <p>
          Track the plots and people you're watching. Come back anytime to see what's changed.
          Saved locally to this device.
        </p>
      </div>

      <div className="results-meta">
        <span>
          <Eye size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Watching
        </span>
      </div>

      {watchedTerms.length > 0 ? (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: 24 }}>
          {watchedTerms.map((term) => (
            <button key={term} className="chip active" onClick={() => handleRemoveWatch(term)}>
              {term} <X size={12} />
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 0, marginBottom: 24 }}>
          Not watching any areas yet. Search a location, then tap "Watch this area" to get alerted when a new report matches it.
        </p>
      )}

      <div className="results-meta">
        <span>
          <Bookmark size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Saved reports
        </span>
      </div>

      {saved.length > 0 ? (
        <div className="report-list">
          {saved.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onClick={() => setView('detail', r)}
              saved={true}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={28} />
          <p>Nothing saved yet. Tap the bookmark icon on any report to track it here.</p>
          <button onClick={() => setView('home')}>Search reports</button>
        </div>
      )}

      <div className="results-meta" style={{ marginTop: 28 }}>
        <span>
          <Home size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Saved listings
        </span>
      </div>

      {savedListings.length > 0 ? (
        <div className="listing-grid">
          {savedListings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onClick={() => setView('listing-detail', l)}
              saved={true}
              onToggleSave={handleToggleSaveListing}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Home size={28} />
          <p>No listings saved yet. Tap the bookmark icon on any listing to track it here.</p>
          <button onClick={() => setView('listings')}>Browse listings</button>
        </div>
      )}
    </>
  )
}
