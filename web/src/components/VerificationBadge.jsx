import { ShieldCheck, ShieldQuestion } from 'lucide-react'
import { getVerificationInfo } from '../data/verificationRules.js'

// Deliberately the same component everywhere, rendering differently based
// on real data — never a green checkmark that looks identical regardless
// of whether there's an actual regulator behind it. A Lagos listing
// backed by LASRERA and a listing from a state with no registry must not
// look the same; that would be misleading by omission.
export default function VerificationBadge({ state, lasreraNumber }) {
  const info = getVerificationInfo(state)

  if (info.hasStateBacking) {
    return (
      <span className="verification-badge verification-badge-backed">
        <ShieldCheck size={13} />
        {lasreraNumber ? `LASRERA #${lasreraNumber}` : `${info.source.split('(')[1]?.replace(')', '') || 'LASRERA'}-eligible`}
      </span>
    )
  }

  return (
    <span className="verification-badge verification-badge-unbacked">
      <ShieldQuestion size={13} />
      No state registry for {state || 'this location'} yet — community-checked only
    </span>
  )
}
