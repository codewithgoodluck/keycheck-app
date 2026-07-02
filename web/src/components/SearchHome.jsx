import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShieldCheck, AlertTriangle, MapPin, FileSearch, ShieldPlus, TrendingUp, Clock3, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import StatsBar from './StatsBar.jsx'
import TrendingCard from './TrendingCard.jsx'
import StatusLegend from './StatusLegend.jsx'
import WatchAreaControls from './WatchAreaControls.jsx'
import { TYPE_LABELS } from '../lib/format.js'
import { logSearchMiss } from '../lib/reportsApi.js'
import { trendingScore, sortByTrending } from '../lib/trending.js'

const KIND_FILTERS = [
  { key: 'all', label: 'Everything', Icon: FileSearch },
  { key: 'flag', label: 'Flags only', Icon: AlertTriangle },
  { key: 'endorsement', label: 'Clean records', Icon: ShieldPlus }
]

const STATUS_FILTERS = [
  { key: 'all', label: 'All reports', Icon: FileSearch },
  { key: 'verified', label: 'Verified only', Icon: ShieldCheck },
  { key: 'disputed', label: 'In court', Icon: AlertTriangle }
]

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All categories' },
  { key: 'land', label: TYPE_LABELS.land },
  { key: 'agent', label: TYPE_LABELS.agent },
  { key: 'house_agent', label: TYPE_LABELS.house_agent },
  { key: 'landlord', label: TYPE_LABELS.landlord },
  { key: 'estate', label: TYPE_LABELS.estate }
]

export default function SearchHome({ reports, listings = [], setView, savedIds, onToggleSave, hasMore, onLoadMore }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const blurTimer = useRef(null)
  const trendingStripRef = useRef(null)

  // Real photos from active listings, not stock imagery — the banner
  // shows an actual property already on the platform. Falls back to the
  // plain gradient hero (no image) when nothing's been listed with a
  // photo yet, rather than showing a broken/empty background.
  const heroPhoto = useMemo(() => {
    const withPhoto = listings.find((l) => l.status === 'active' && (l.photoUrls?.[0] || l.photoUrl))
    return withPhoto ? withPhoto.photoUrls?.[0] || withPhoto.photoUrl : null
  }, [listings])

  function scrollTrending(dir) {
    const el = trendingStripRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
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

  const trendingReports = useMemo(() => sortByTrending(reports).slice(0, 5), [reports])

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
      <section
        className={`hero ${heroPhoto ? 'hero-photo' : ''}`}
        style={heroPhoto ? { backgroundImage: `url(${heroPhoto})` } : undefined}
      >
        <p className="eyebrow">
          <ShieldCheck size={13} /> Community housing &amp; land registry
        </p>
        <h1>Check before you buy or rent. Warn others after.</h1>
        <p>
          Search a location, agent, landlord, or developer name to see whether others have
          reported a problem — or vouched for a clean transaction. Free, and you don't need
          an account to search.
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

      {trendingReports.length > 0 && (
        <div className="trending-section">
          <p className="trending-section-label">
            <TrendingUp size={13} /> Trending now
          </p>
          <div className="trending-carousel">
            <button
              type="button"
              className="trending-carousel-nav prev"
              onClick={() => scrollTrending(-1)}
              aria-label="Scroll trending left"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="trending-strip" ref={trendingStripRef}>
              {trendingReports.map((r) => (
                <TrendingCard key={r.id} report={r} onClick={() => setView('detail', r)} />
              ))}
            </div>
            <button
              type="button"
              className="trending-carousel-nav next"
              onClick={() => scrollTrending(1)}
              aria-label="Scroll trending right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
        {KIND_FILTERS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`chip ${kindFilter === key ? 'active' : ''}`}
            onClick={() => setKindFilter(key)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {kindFilter !== 'endorsement' && (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
          {STATUS_FILTERS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`chip ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
      )}

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${categoryFilter === key ? 'active' : ''}`}
            onClick={() => setCategoryFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

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
