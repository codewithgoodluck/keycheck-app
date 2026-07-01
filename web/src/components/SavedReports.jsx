import { useState } from 'react'
import { Bookmark, Eye, X } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import { getWatchedTerms, removeWatch } from '../lib/watches.js'

export default function SavedReports({ reports, savedIds, setView, onToggleSave }) {
  const saved = reports.filter((r) => savedIds.includes(r.id))
  const [watchedTerms, setWatchedTerms] = useState(() => getWatchedTerms())

  function handleRemoveWatch(term) {
    setWatchedTerms(removeWatch(term))
  }

  return (
    <>
      <div className="saved-header">
        <h1>Saved &amp; watching</h1>
        <p>Plots, agents, and areas you're keeping an eye on. Saved locally to this device.</p>
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
    </>
  )
}
