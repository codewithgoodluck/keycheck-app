import { useEffect, useMemo, useState } from 'react'
import { Search, FileSearch, Home, Plus, GitCompare, Users, History, X, SlidersHorizontal, ChevronDown, Compass } from 'lucide-react'
import ListingCard from './ListingCard.jsx'
import WatchAreaControls from './WatchAreaControls.jsx'
import { PROPERTY_TYPE_LABELS, getPropertyTypeLabel } from '../data/propertyTypes.js'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { getEffectiveStatus, getFlaggedAgentNames } from '../lib/listingsApi.js'
import { getCompareIds, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
import { getSavedListingIds, toggleSavedListing } from '../lib/listingWatchlist.js'
import { getRecentlyViewedIds, clearRecentlyViewed } from '../lib/recentlyViewed.js'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All categories' },
  ...Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => ({ key, label }))
]

// Structurally mirrors SearchHome.jsx (search bar, filter chips,
// client-side filtering over an already-subscribed array) — still no
// autocomplete/trending, those stay report-specific, but watch/push now
// reuses WatchAreaControls (see App.jsx's parallel listings-matching
// effect for the other half of this feature).
export default function ListingsBrowse({ listings, reports, setView, hasMore, onLoadMore, listerUser }) {
  const flaggedAgentNames = useMemo(() => getFlaggedAgentNames(reports), [reports])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [compareIds, setCompareIds] = useState(() => getCompareIds())
  const [savedIds, setSavedIds] = useState(() => getSavedListingIds())
  const [recentIds, setRecentIds] = useState(() => getRecentlyViewedIds())

  // Session memory without requiring login — re-read whenever the
  // listings feed itself changes, since that's the only signal this
  // component gets that a visit to a listing detail page (which is what
  // actually appends to the list) may have happened since last render.
  useEffect(() => {
    setRecentIds(getRecentlyViewedIds())
  }, [listings])

  const recentlyViewed = recentIds.map((id) => listings.find((l) => l.id === id)).filter(Boolean)

  function handleClearRecent() {
    setRecentIds(clearRecentlyViewed())
  }

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
    // no scheduled job to flip status to 'expired' at the 30-day mark, or
    // to catch a lister whose fraud report landed *after* their listing
    // was activated — filter both out here (see lib/listingsApi.js's
    // getEffectiveStatus) rather than needing a scheduled backend job.
    let list = listings.filter((l) => !['expired', 'blocked'].includes(getEffectiveStatus(l, flaggedAgentNames)))
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
  }, [submittedQuery, categoryFilter, stateFilter, listings, flaggedAgentNames])

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
        <h1>Find your next home, already checked.</h1>
        <p>
          Every listing here is tied to a real profile — see the track record before you ever pick
          up the phone.
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
          <button className="chip" onClick={() => setView('market')}>
            <Compass /> Not sure what you're looking for? Try guided search
          </button>
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="results-meta">
            <span>
              <History size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Recently viewed
            </span>
            <button className="chip" onClick={handleClearRecent}>
              <X size={12} /> Clear all
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {recentlyViewed.map((l) => (
              <button
                key={l.id}
                onClick={() => setView('listing-detail', l)}
                style={{
                  flexShrink: 0,
                  width: 150,
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <div style={{ width: '100%', height: 90, background: 'var(--brand-tint-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(l.photoUrls?.[0] || l.photoUrl) ? (
                    <img src={l.photoUrls?.[0] || l.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Home size={20} color="var(--ink-faint)" />
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px' }}>₦{Number(l.price).toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: 0 }}>{getPropertyTypeLabel(l.type)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Same redesigned filter bar pattern as the home page: one
          primary segmented toggle (category — the thing you'd change
          most often) and a single expandable panel for the secondary
          filter (state — 37 options is too many to keep permanently
          visible as a stacked pill row). */}
      <div className="filter-bar">
        <div className="segmented-control">
          {CATEGORY_FILTERS.map(({ key, label }) => (
            <button key={key} className={categoryFilter === key ? 'active' : ''} onClick={() => setCategoryFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <button className={`filters-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal size={13} />
          Filters
          {stateFilter !== 'all' && <span className="filters-count-badge">1</span>}
          <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-group">
            <p className="filters-group-label">State</p>
            <div className="chip-row" style={{ marginTop: 0 }}>
              <button className={`chip ${stateFilter === 'all' ? 'active' : ''}`} onClick={() => setStateFilter('all')}>
                All states
              </button>
              {NIGERIAN_STATES.map((s) => (
                <button key={s} className={`chip ${stateFilter === s ? 'active' : ''}`} onClick={() => setStateFilter(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
