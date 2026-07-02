import { useMemo, useState } from 'react'
import { Search, FileSearch, Home, Plus, GitCompare, Users } from 'lucide-react'
import ListingCard from './ListingCard.jsx'
import WatchAreaControls from './WatchAreaControls.jsx'
import { PROPERTY_TYPE_LABELS } from '../data/propertyTypes.js'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { getEffectiveStatus } from '../lib/listingsApi.js'
import { getCompareIds, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
import { getSavedListingIds, toggleSavedListing } from '../lib/listingWatchlist.js'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All categories' },
  ...Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => ({ key, label }))
]

// Structurally mirrors SearchHome.jsx (search bar, filter chips,
// client-side filtering over an already-subscribed array) — still no
// autocomplete/trending, those stay report-specific, but watch/push now
// reuses WatchAreaControls (see App.jsx's parallel listings-matching
// effect for the other half of this feature).
export default function ListingsBrowse({ listings, setView, hasMore, onLoadMore, listerUser }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [compareIds, setCompareIds] = useState(() => getCompareIds())
  const [savedIds, setSavedIds] = useState(() => getSavedListingIds())

  function handleToggleCompare(id) {
    if (!compareIds.includes(id) && compareIds.length >= MAX_COMPARE) {
      alert(`You can compare up to ${MAX_COMPARE} listings at a time. Remove one first.`)
      return
    }
    setCompareIds(toggleCompare(id))
  }

  function handleToggleSave(id) {
    setSavedIds(toggleSavedListing(id))
  }

  const results = useMemo(() => {
    // Query already fetches status == 'active' server-side, but there's
    // no scheduled job to flip status to 'expired' at the 30-day mark —
    // filter that out here (see lib/listingsApi.js's getEffectiveStatus)
    // rather than needing a composite index on expiresAt.
    let list = listings.filter((l) => getEffectiveStatus(l) !== 'expired')
    if (submittedQuery.trim()) {
      const q = submittedQuery.toLowerCase()
      list = list.filter((l) => l.locationText?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      list = list.filter((l) => l.type === categoryFilter)
    }
    if (stateFilter !== 'all') {
      list = list.filter((l) => l.state === stateFilter)
    }
    return list
  }, [submittedQuery, categoryFilter, stateFilter, listings])

  function handleSearch(e) {
    e.preventDefault()
    setSubmittedQuery(query)
  }

  return (
    <div className="theme-market">
      <section className="hero">
        <p className="eyebrow">
          <Home size={13} /> Verified listings
        </p>
        <h1>Browse listings — checked against KeyCheck's fraud registry.</h1>
        <p>
          Every listing here has been reviewed by a moderator, and is automatically blocked if the
          lister has an active disputed or verified fraud report.
        </p>
        <div className="search-wrap">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by location, e.g. 'Lekki Phase 2'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="chip-row">
          <button className="chip active" onClick={() => setView('submit-listing')}>
            <Plus /> List a property
          </button>
          {listerUser && (
            <button className="chip" onClick={() => setView('my-listings')}>
              <Home /> My listings
            </button>
          )}
          <button className="chip" onClick={() => setView('buyers-agent-directory')}>
            <Users /> Want someone repping you instead? Find a buyer's agent
          </button>
        </div>
      </section>

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <button key={key} className={`chip ${categoryFilter === key ? 'active' : ''}`} onClick={() => setCategoryFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
        <button className={`chip ${stateFilter === 'all' ? 'active' : ''}`} onClick={() => setStateFilter('all')}>
          All states
        </button>
        {NIGERIAN_STATES.map((s) => (
          <button key={s} className={`chip ${stateFilter === s ? 'active' : ''}`} onClick={() => setStateFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="results-meta">
        <span>{results.length} listing{results.length === 1 ? '' : 's'}</span>
        {submittedQuery && <span>Showing results for "{submittedQuery}"</span>}
      </div>

      <WatchAreaControls term={submittedQuery} />

      {compareIds.length >= 2 && (
        <div className="watch-alerts">
          <div className="watch-alert">
            <GitCompare size={15} />
            <span>{compareIds.length} listings selected to compare.</span>
            <button onClick={() => setView('compare-listings')}>Compare</button>
          </div>
        </div>
      )}

      {results.length > 0 ? (
        <>
          <div className="listing-grid">
            {results.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onClick={() => setView('listing-detail', l)}
                comparing={compareIds.includes(l.id)}
                onToggleCompare={handleToggleCompare}
                saved={savedIds.includes(l.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
          {hasMore && (
            <button className="chip" style={{ display: 'flex', margin: '18px auto 0' }} onClick={onLoadMore}>
              Load more listings
            </button>
          )}
        </>
      ) : (
        <div className="empty-state">
          <FileSearch size={28} />
          <p>No listings found. Be the first to list here.</p>
          <button onClick={() => setView('submit-listing')}>List a property</button>
        </div>
      )}
    </div>
  )
}
