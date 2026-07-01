import { Users, MessageSquare } from 'lucide-react'
import { StampIcon, resolveStampKey } from './Stamp.jsx'
import { getReportTitle } from '../lib/format.js'

// Deliberately a separate, minimal component rather than a "compact" mode
// bolted onto ReportCard — ReportCard is already reused in AgentProfile
// and SavedReports, and this card's fixed-width horizontal-scroll layout
// is a genuinely different shape, not just a smaller version.
export default function TrendingCard({ report, onClick }) {
  const title = getReportTitle(report)
  const stampKey = resolveStampKey(report.status, report.kind)

  return (
    <div className="trending-card" onClick={onClick}>
      <div className={`card-icon ${stampKey}`}>
        <StampIcon status={report.status} kind={report.kind} size={16} />
      </div>
      <h4>{title}</h4>
      <div className="trending-card-stats">
        <span>
          <Users /> {report.upvotes || 0}
        </span>
        <span>
          <MessageSquare /> {report.replies?.length || 0}
        </span>
      </div>
    </div>
  )
}
