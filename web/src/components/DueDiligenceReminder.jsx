import { ShieldCheck, ShieldQuestion } from 'lucide-react'

// A verification badge is a signal, not a guarantee — even a real
// LASRERA/CAC check only confirms registration, not that this specific
// transaction is safe. Shown on every listing/profile page (below the
// trust badge) and again right before the contact buttons, since a
// reminder seen once on page load is easy to scroll past by the time
// someone's actually about to act on it. Wording differs on purpose:
// an unverified lister needs a stronger "verify independently" nudge,
// while a verified one still needs "don't stop checking just because
// a badge is green" — collapsing both into one generic disclaimer
// would undersell the first case and overstate the second.
export default function DueDiligenceReminder({ verifiedLabel, compact = false }) {
  const verified = Boolean(verifiedLabel)
  return (
    <div
      className="fact-box"
      style={{
        background: verified ? 'var(--brand-tint-light)' : 'var(--status-unverified-soft)',
        marginTop: compact ? 0 : undefined,
        marginBottom: compact ? 12 : undefined
      }}
    >
      {verified ? <ShieldCheck size={18} color="var(--brand-hover)" /> : <ShieldQuestion size={18} color="var(--status-unverified)" />}
      <div>
        {verified ? (
          <>
            <strong>This lister passed a {verifiedLabel} check.</strong> Still confirm current
            documents yourself before paying anything — registration doesn't guarantee this specific
            transaction is safe.
          </>
        ) : (
          <>
            <strong>This lister hasn't been checked against any official registry.</strong> Verify
            independently before proceeding — physically visit the property, confirm documents at
            the official registry, never pay in full before inspection.
          </>
        )}
      </div>
    </div>
  )
}
