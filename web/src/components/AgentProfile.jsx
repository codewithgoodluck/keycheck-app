import { ShieldAlert, ArrowLeft } from 'lucide-react'
import ReportCard from './ReportCard.jsx'

// Groups reports by an exact agentName match. Names in the data are free
// text (sometimes with aliases appended, e.g. "X / Y Ltd"), so this is a
// literal match rather than fuzzy dedup — good enough to surface a repeat
// offender's full history without risking merging two different people who
// happen to share a similar name.
export default function AgentProfile({ reports, name, setView, savedIds, onToggleSave }) {
  const target = (name || '').trim().toLowerCase()
  const matches = reports.filter((r) => r.agentName?.trim().toLowerCase() === target)

  const verifiedCount = matches.filter((r) => r.status === 'verified').length
  const disputedCount = matches.filter((r) => r.status === 'disputed').length
  const totalConfirmations = matches.reduce((sum, r) => sum + (r.upvotes || 0), 0)

  return (
    <>
      <button className="detail-back" onClick={() => setView('home')}>
        <ArrowLeft size={15} /> Back to search
      </button>

      <div className="saved-header">
        <h1>{name}</h1>
        <p>
          {matches.length} report{matches.length === 1 ? '' : 's'} filed under this exact name.
          Names are free text, entered by whoever filed the report — this page only groups exact
          matches, so the same person or company under a slightly different spelling won't appear here.
        </p>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="num">{matches.length}</div>
          <div className="label">Reports</div>
        </div>
        <div className="stat-card">
          <div className="num">{verifiedCount}</div>
          <div className="label">Court-verified</div>
        </div>
        <div className="stat-card">
          <div className="num">{disputedCount}</div>
          <div className="label">In court</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalConfirmations}</div>
          <div className="label">Confirmations</div>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="report-list">
          {matches.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onClick={() => setView('detail', r)}
              saved={savedIds.includes(r.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShieldAlert size={28} />
          <p>No reports found under this exact name.</p>
        </div>
      )}
    </>
  )
}
