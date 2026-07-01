import { ShieldCheck, AlertTriangle, Clock, BadgeCheck } from 'lucide-react'

const CONFIG = {
  verified: { label: 'Verified', Icon: ShieldCheck },
  disputed: { label: 'Disputed', Icon: AlertTriangle },
  unverified: { label: 'Unverified', Icon: Clock },
  clean: { label: 'Clean record', Icon: BadgeCheck }
}

// Endorsements ("clean transaction" vouches) ignore the flag status
// entirely — "unverified"/"disputed" framing doesn't fit a positive claim,
// so they always render as the distinct "clean" stamp regardless of status.
export function resolveStampKey(status, kind) {
  if (kind === 'endorsement') return 'clean'
  return CONFIG[status] ? status : 'unverified'
}

export function StampIcon({ status, kind, size = 20 }) {
  const { Icon } = CONFIG[resolveStampKey(status, kind)]
  return <Icon size={size} />
}

export function StampInline({ status, kind }) {
  const key = resolveStampKey(status, kind)
  const { label, Icon } = CONFIG[key]
  return (
    <span className={`stamp-inline ${key}`}>
      <Icon />
      {label}
    </span>
  )
}
