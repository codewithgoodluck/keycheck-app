import { Bookmark } from 'lucide-react'
import ReportCard from './ReportCard.jsx'

export default function SavedReports({ reports, savedIds, setView, onToggleSave }) {
  const saved = reports.filter((r) => savedIds.includes(r.id))

  return (
    <>
      <div className="saved-header">
        <h1>Saved reports</h1>
        <p>Plots and agents you're keeping an eye on. Saved locally to this device.</p>
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
