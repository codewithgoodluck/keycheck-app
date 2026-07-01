import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, AlertTriangle, MapPin, FileSearch } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import StatsBar from './StatsBar.jsx'
import { TYPE_LABELS } from '../lib/format.js'
import { logSearchMiss } from '../lib/reportsApi.js'

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

export default function SearchHome({ reports, setView, savedIds, onToggleSave, hasMore, onLoadMore }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

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
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }
    if (categoryFilter !== 'all') {
      list = list.filter((r) => r.type === categoryFilter)
    }
    return list
  }, [submittedQuery, statusFilter, categoryFilter, reports])

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
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">
          <ShieldCheck size={13} /> Community housing &amp; land registry
        </p>
        <h1>Check before you buy or rent. Warn others after.</h1>
        <p>
          Search a location, agent, landlord, or developer name to see whether others have
          reported a land dispute, rental scam, landlord fraud, or estate/developer problem.
          Free, and you don't need an account to search.
        </p>
        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search a location or agent name, e.g. 'Lekki Phase 2'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

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
      </div>

      {results.length > 0 ? (
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
