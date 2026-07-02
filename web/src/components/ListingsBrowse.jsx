import { useMemo, useState } from 'react'
import { Search, FileSearch, Home, Plus } from 'lucide-react'
import ListingCard from './ListingCard.jsx'
import { TYPE_LABELS } from '../lib/format.js'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { getEffectiveStatus } from '../lib/listingsApi.js'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All categories' },
  { key: 'land', label: TYPE_LABELS.land },
  { key: 'agent', label: TYPE_LABELS.agent },
  { key: 'house_agent', label: TYPE_LABELS.house_agent },
  { key: 'landlord', label: TYPE_LABELS.landlord },
  { key: 'estate', label: TYPE_LABELS.estate }
]

// Structurally mirrors SearchHome.jsx (search bar, filter chips,
// client-side filtering over an already-subscribed array) but deliberately
// slimmer for this first slice — no autocomplete, trending, or watch/push,
// those stay report-specific until listings prove out the core loop.
export default function ListingsBrowse({ listings, setView, hasMore, onLoadMore, listerUser }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')

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
    <>
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

      {results.length > 0 ? (
        <div className="report-list">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} onClick={() => setView('listing-detail', l)} />
          ))}
          {hasMore && (
            <button className="chip" style={{ alignSelf: 'center', marginTop: 8 }} onClick={onLoadMore}>
              Load more listings
            </button>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <FileSearch size={28} />
          <p>No listings found. Be the first to list here.</p>
          <button onClick={() => setView('submit-listing')}>List a property</button>
        </div>
      )}
    </>
  )
}
