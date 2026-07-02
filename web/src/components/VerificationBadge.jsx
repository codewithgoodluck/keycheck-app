import { ShieldCheck, ShieldQuestion, BadgeCheck } from 'lucide-react'
import { getVerificationInfo } from '../data/verificationRules.js'

// Deliberately the same component everywhere, rendering differently based
// on real data — never a green checkmark that looks identical regardless
// of whether there's an actual regulator behind it. A Lagos listing
// backed by LASRERA and a listing from a state with no registry must not
// look the same; that would be misleading by omission.
//
// lasreraVerified distinguishes a self-reported number (the lister typed
// it in, unconfirmed) from one a moderator has actually checked against
// the real LASRERA search — those are different trust levels and must say
// so, not just show the number either way.
export default function VerificationBadge({ state, lasreraNumber, lasreraVerified }) {
  const info = getVerificationInfo(state)

  if (info.hasStateBacking) {
    if (lasreraNumber && lasreraVerified) {
      return (
        <span className="verification-badge verification-badge-backed">
          <BadgeCheck size={13} />
          LASRERA #{lasreraNumber} — moderator-checked
        </span>
      )
    }
    return (
      <span className="verification-badge verification-badge-backed">
        <ShieldCheck size={13} />
        {lasreraNumber
          ? `LASRERA #${lasreraNumber} (self-reported, not yet checked)`
          : `${info.source.split('(')[1]?.replace(')', '') || 'LASRERA'}-eligible`}
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
