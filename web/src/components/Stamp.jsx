import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react'

const CONFIG = {
  verified: { label: 'Verified', Icon: ShieldCheck },
  disputed: { label: 'Disputed', Icon: AlertTriangle },
  unverified: { label: 'Unverified', Icon: Clock }
}

export function StampIcon({ status, size = 20 }) {
  const { Icon } = CONFIG[status] || CONFIG.unverified
  return <Icon size={size} />
}

export function StampInline({ status }) {
  const { label, Icon } = CONFIG[status] || CONFIG.unverified
  return (
    <span className={`stamp-inline ${status}`}>
      <Icon />
      {label}
    </span>
  )
}
