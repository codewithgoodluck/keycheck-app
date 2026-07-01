import { StampInline } from './Stamp.jsx'

// Single source of truth for what each badge means, reusing Stamp.jsx's
// CONFIG (via StampInline) rather than maintaining a second hardcoded
// label/color list — MapView used to keep its own separate legend that
// could silently drift out of sync with the actual badges shown on cards.
const STATUSES = [
  { status: 'verified', kind: undefined },
  { status: 'disputed', kind: undefined },
  { status: 'unverified', kind: undefined },
  { status: 'unverified', kind: 'endorsement' }
]

export default function StatusLegend() {
  return (
    <div className="chip-row status-legend">
      {STATUSES.map(({ status, kind }) => (
        <StampInline key={kind || status} status={status} kind={kind} />
      ))}
    </div>
  )
}
