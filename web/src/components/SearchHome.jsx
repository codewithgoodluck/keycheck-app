import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShieldCheck, AlertTriangle, MapPin, FileSearch, ShieldPlus, TrendingUp, Clock3, Users, SlidersHorizontal, ChevronDown } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import StatsBar from './StatsBar.jsx'
import StatusLegend from './StatusLegend.jsx'
import WatchAreaControls from './WatchAreaControls.jsx'
import { logSearchMiss } from '../lib/reportsApi.js'
import { trendingScore } from '../lib/trending.js'

const KIND_FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'flag', label: 'Flags only' },
  { key: 'endorsement', label: 'Clean records' }
]

// Shorter labels than lib/format.js's TYPE_LABELS on purpose — those
// carry "flagged"/"vouched for" because they name a specific report;
// here you're picking a category to filter by, not stating a fact
// about one report, so the qualifier is redundant.
const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'verified', label: 'Verified' },
  { key: 'disputed', label: 'In court' }
]

const CATEGORY_FILTERS = [
  { key: 'land', label: 'Land dispute' },
  { key: 'agent', label: 'Land agent' },
  { key: 'house_agent', label: 'Rental agent' },
  { key: 'landlord', label: 'Landlord' },
  { key: 'estate', label: 'Estate/developer' }
]

export default function SearchHome({ reports, setView, savedIds, onToggleSave, hasMore, onLoadMore }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const blurTimer = useRef(null)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)

  function toggleCategoryFilter(key) {
    setCategoryFilter((c) => (c === key ? 'all' : key))
  }

  const trendingLocations = useMemo(() => {
    const counts = {}
    reports.forEach((r) => {
      const area = r.locationText.split(',')[0].trim()
      counts[area] = (counts[area] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area)
  }, [reports])

  const { locationOptions, nameOptions } = useMemo(() => {
    const locations = new Map()
    const names = new Map()
    reports.forEach((r) => {
      const area = r.locationText?.split(',')[0].trim()
      if (area) locations.set(area.toLowerCase(), area)
      const name = r.agentName?.trim()
      if (name) names.set(name.toLowerCase(), name)
    })
    return { locationOptions: [...locations.values()], nameOptions: [...names.values()] }
  }, [reports])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const matchLocations = locationOptions
      .filter((v) => v.toLowerCase().includes(q))
      .slice(0, 5)
      .map((value) => ({ type: 'location', value }))
    const matchNames = nameOptions
      .filter((v) => v.toLowerCase().includes(q))
      .slice(0, 5)
      .map((value) => ({ type: 'name', value }))
    return [...matchLocations, ...matchNames]
  }, [query, locationOptions, nameOptions])

  const results = useMemo(() => {
    let list = reports
    if (submittedQuery.trim()) {
      const q = submittedQuery.toLowerCase()
      list = list.filter(
        (r) =>
          r.locationText?.toLowerCase().includes(q) ||
          r.agentName?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
    }
    if (kindFilter === 'flag') {
      list = list.filter((r) => r.kind !== 'endorsement')
    } else if (kindFilter === 'endorsement') {
      list = list.filter((r) => r.kind === 'endorsement')
    }
    if (kindFilter !== 'endorsement' && statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }
    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.type === categoryFilter)
    }
    if (sortMode === 'trending') {
      list = [...list].sort((a, b) => trendingScore(b) - trendingScore(a))
    }
    return list
  }, [submittedQuery, kindFilter, statusFilter, categoryFilter, sortMode, reports])

  useEffect(() => {
    if (submittedQuery.trim() && results.length === 0) {
      logSearchMiss(submittedQuery)
    }
  }, [submittedQuery, results.length])

  function handleSearch(e) {
    e.preventDefault()
    setSubmittedQuery(query)
  }

  function handleChipClick(area) {
    setQuery(area)
    setSubmittedQuery(area)
    setShowSuggestions(false)
  }

  function selectSuggestion(item) {
    if (!item) return
    setShowSuggestions(false)
    setActiveIndex(-1)
    if (item.type === 'location') {
      handleChipClick(item.value)
    } else {
      setQuery(item.value)
      setView('profile', item.value)
    }
  }

  function handleInputKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">
          <ShieldCheck size={13} /> Community housing &amp; land registry
        </p>
        <h1>Know before you owe.</h1>
        <p>
          Search any agent, landlord, or plot in seconds. Every red flag traces back to a real
          court filing or news report — every clean record means nobody's found a reason to worry.
        </p>
        <div className="search-wrap">
          <form
            className="search-bar"
            onSubmit={(e) => {
              handleSearch(e)
              setShowSuggestions(false)
            }}
          >
            <Search size={18} />
            <input
              type="text"
              placeholder="Search a location or agent name, e.g. 'Lekki Phase 2'"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
                setActiveIndex(-1)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setShowSuggestions(false), 120)
              }}
              onKeyDown={handleInputKeyDown}
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-autocomplete="list"
            />
            <button type="submit">Search</button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions" role="listbox">
              {suggestions.some((s) => s.type === 'location') && (
                <p className="search-suggestions-label">Locations</p>
              )}
              {suggestions
                .filter((s) => s.type === 'location')
                .map((item) => {
                  const index = suggestions.indexOf(item)
                  return (
                    <button
                      key={`loc-${item.value}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? 'active' : ''}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        clearTimeout(blurTimer.current)
                        selectSuggestion(item)
                      }}
                    >
                      <MapPin size={14} /> {item.value}
                    </button>
                  )
                })}
              {suggestions.some((s) => s.type === 'name') && (
                <p className="search-suggestions-label">People &amp; companies</p>
              )}
              {suggestions
                .filter((s) => s.type === 'name')
                .map((item) => {
                  const index = suggestions.indexOf(item)
                  return (
                    <button
                      key={`name-${item.value}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? 'active' : ''}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        clearTimeout(blurTimer.current)
                        selectSuggestion(item)
                      }}
                    >
                      <Users size={14} /> {item.value}
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        {trendingLocations.length > 0 && (
          <div className="chip-row">
            {trendingLocations.map((area) => (
              <button key={area} className="chip" onClick={() => handleChipClick(area)}>
                <MapPin /> {area}
              </button>
            ))}
          </div>
        )}
      </section>

      <StatsBar reports={reports} />
      <StatusLegend />

      {/* Redesigned filter bar: one primary segmented view toggle
          (kind — the thing you'd change most often) plus a single
          expandable panel for the two secondary filters (status,
          category), instead of three stacked pill rows that all looked
          the same and made it unclear which filter mattered most. */}
      <div className="filter-bar">
        <div className="segmented-control">
          {KIND_FILTERS.map(({ key, label }) => (
            <button key={key} className={kindFilter === key ? 'active' : ''} onClick={() => setKindFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <button className={`filters-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && <span className="filters-count-badge">{activeFilterCount}</span>}
          <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          {kindFilter !== 'endorsement' && (
            <div className="filters-group">
              <p className="filters-group-label">Status</p>
              <div className="chip-row" style={{ marginTop: 0 }}>
                {STATUS_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`chip ${statusFilter === key ? 'active' : ''}`}
                    onClick={() => setStatusFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filters-group">
            <p className="filters-group-label">Category</p>
            <div className="chip-row" style={{ marginTop: 0 }}>
              {CATEGORY_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`chip ${categoryFilter === key ? 'active' : ''}`}
                  onClick={() => toggleCategoryFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="results-meta">
        <span>{results.length} report{results.length === 1 ? '' : 's'}</span>
        {submittedQuery && <span>Showing results for "{submittedQuery}"</span>}
        <span className="sort-toggle">
          <button className={sortMode === 'newest' ? 'active' : ''} onClick={() => setSortMode('newest')}>
            <Clock3 size={12} /> Newest
          </button>
          <button className={sortMode === 'trending' ? 'active' : ''} onClick={() => setSortMode('trending')}>
            <TrendingUp size={12} /> Trending
          </button>
        </span>
      </div>

      <WatchAreaControls term={submittedQuery} />

      {results.length > 0 ? (
        kindFilter === 'all' ? (
          // Flags and vouches are different kinds of claim (an accusation
          // vs. a positive experience) — shown in separate sections by
          // default rather than interleaved in one feed, so a vouch never
          // reads as "just another status" next to a fraud flag. Picking
          // a specific kind filter above still shows a single flat list.
          <>
            {results.filter((r) => r.kind !== 'endorsement').length > 0 && (
              <>
                <div className="results-meta"><span><AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Flagged reports</span></div>
                <div className="report-list" style={{ marginBottom: 24 }}>
                  {results
                    .filter((r) => r.kind !== 'endorsement')
                    .map((r) => (
                      <ReportCard key={r.id} report={r} onClick={() => setView('detail', r)} saved={savedIds.includes(r.id)} onToggleSave={onToggleSave} />
                    ))}
                </div>
              </>
            )}
            {results.filter((r) => r.kind === 'endorsement').length > 0 && (
              <>
                <div className="results-meta"><span><ShieldPlus size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Clean records</span></div>
                <div className="report-list">
                  {results
                    .filter((r) => r.kind === 'endorsement')
                    .map((r) => (
                      <ReportCard key={r.id} report={r} onClick={() => setView('detail', r)} saved={savedIds.includes(r.id)} onToggleSave={onToggleSave} />
                    ))}
                </div>
              </>
            )}
            {hasMore && (
              <button className="chip" style={{ display: 'flex', margin: '16px auto 0' }} onClick={onLoadMore}>
                Load more reports
              </button>
            )}
          </>
        ) : (
          <div className="report-list">
            {results.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onClick={() => setView('detail', r)}
                saved={savedIds.includes(r.id)}
                onToggleSave={onToggleSave}
              />
            ))}
            {hasMore && (
              <button className="chip" style={{ alignSelf: 'center', marginTop: 8 }} onClick={onLoadMore}>
                Load more reports
              </button>
            )}
          </div>
        )
      ) : (
        <div className="empty-state">
          <FileSearch size={28} />
          <p>
            No flagged reports found for "{submittedQuery}". That's a good
            sign, but it doesn't guarantee the land or agent is clean, only
            that nobody has reported a problem here yet.
          </p>
          <button onClick={() => setView('submit')}>Report something instead</button>
        </div>
      )}
    </>
  )
}
