import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { getFeeCapInfo, DUAL_REP_LABELS } from '../data/verificationRules.js'

// Distinct from VerificationBadge.jsx — that one is about whether a
// registry backs this listing at all; this one is about a specific
// listing's actual fee number against the applicable cap, a different
// claim that shouldn't be visually conflated with it.
export default function FeeComplianceNote({ state, transactionType, agencyFeePercent, dualRepresentation }) {
  const capInfo = getFeeCapInfo(state, transactionType, agencyFeePercent)
  const dualRepLabel = DUAL_REP_LABELS[dualRepresentation]

  let feeNote
  if (capInfo.capApplies && capInfo.exceeds) {
    feeNote = (
      <span className="fee-note fee-note-warning">
        <AlertTriangle size={13} />
        {agencyFeePercent}% fee exceeds the Lagos {capInfo.cap}% cap for a {transactionType}
      </span>
    )
  } else if (capInfo.capApplies) {
    feeNote = (
      <span className="fee-note fee-note-ok">
        <CheckCircle2 size={13} />
        {agencyFeePercent}% fee — within the Lagos {capInfo.cap}% cap
      </span>
    )
  } else {
    feeNote = (
      <span className="fee-note fee-note-neutral">
        <HelpCircle size={13} />
        {agencyFeePercent}% fee — no enforceable cap for this location
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {feeNote}
      {dualRepLabel && <span className="fee-note fee-note-neutral">{dualRepLabel}</span>}
    </div>
  )
}
