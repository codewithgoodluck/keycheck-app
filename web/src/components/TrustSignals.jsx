import { Building2, ShieldCheck } from 'lucide-react'

// Distinct from VerificationBadge.jsx (Lagos-only LASRERA backing) — these
// are the two "no strong legal backing found" signals from the spec's
// legal-status table: a CAC number is nationally checkable but KeyCheck
// doesn't verify it itself unless a moderator has (cacVerified), and PI
// insurance is a voluntary trust signal with no Nigerian legal requirement
// behind it at all. Both must say so plainly, never read as a certification.
export default function TrustSignals({ cacNumber, cacVerified, professionalIndemnityInsurance }) {
  if (!cacNumber && !professionalIndemnityInsurance) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {cacNumber && (
        <span className={`verification-badge ${cacVerified ? 'verification-badge-backed' : 'verification-badge-unbacked'}`}>
          <Building2 size={13} />
          {cacVerified ? `CAC #${cacNumber} — moderator-checked` : `CAC #${cacNumber} (self-reported, not independently verified)`}
        </span>
      )}
      {professionalIndemnityInsurance && (
        <span className="verification-badge verification-badge-unbacked">
          <ShieldCheck size={13} />
          Carries professional indemnity insurance (self-declared, voluntary — not a legal requirement in Nigeria)
        </span>
      )}
    </div>
  )
}
