import { MapPin, Clock, Users, Bookmark } from 'lucide-react'
import { StampIcon } from './Stamp.jsx'
import { timeAgo } from '../lib/time.js'
import { getReportTitle } from '../lib/format.js'

export default function ReportCard({ report, onClick, saved, onToggleSave }) {
  const title = getReportTitle(report)

  return (
    <div className="report-card" onClick={onClick}>
      <div className={`card-icon ${report.status}`}>
        <StampIcon status={report.status} size={20} />
      </div>
      <div className="card-body">
        <div className="card-top-row">
          <div>
            <h3>{title}</h3>
            <p className="desc">{report.description}</p>
          </div>
          <button
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave(report.id)
            }}
            aria-label={saved ? 'Remove from saved' : 'Save report'}
          >
            <Bookmark size={18} />
          </button>
        </div>
        <div className="card-meta">
          <span>
            <MapPin /> {report.locationText}
          </span>
          <span>
            <Clock /> {timeAgo(report.dateReported)}
          </span>
          {report.upvotes > 0 && (
            <span>
              <Users /> {report.upvotes} confirmed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
