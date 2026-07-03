import { Building2, ShieldCheck, FileCheck } from 'lucide-react'
import { getTitleDocumentLabel } from '../data/listingFacts.js'

// Distinct from VerificationBadge.jsx (Lagos-only LASRERA backing) — these
// are all "no strong legal backing found" signals from the spec's
// legal-status table: a CAC number is nationally checkable but KeyCheck
// doesn't verify it itself unless a moderator has (cacVerified); a title
// document claim is the same story (titleDocumentVerified); PI insurance
// and "no known encumbrance" are voluntary self-declarations with no
// Nigerian registry behind them at all (unlike Kenya's Ardhisasa, which a
// competitor's "Freehold/Title Ready" badges likely draw on — KeyCheck has
// no equivalent API integration yet). All of these must say so plainly,
// never read as a certification.
export default function TrustSignals({
  cacNumber,
  cacVerified,
  professionalIndemnityInsurance,
  titleDocumentType,
  titleDocumentVerified,
  encumbranceFreeDeclared
}) {
  const titleDocLabel = getTitleDocumentLabel(titleDocumentType)
  if (!cacNumber && !professionalIndemnityInsurance && !titleDocLabel) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {titleDocLabel && (
        <span className={`verification-badge ${titleDocumentVerified ? 'verification-badge-backed' : 'verification-badge-unbacked'}`}>
          <FileCheck size={13} />
          {titleDocumentVerified ? `${titleDocLabel} (moderator-checked)` : `${titleDocLabel} (self-reported, not independently verified)`}
        </span>
      )}
      {titleDocLabel && encumbranceFreeDeclared && (
        <span className="verification-badge verification-badge-unbacked">
          <ShieldCheck size={13} />
          No known encumbrance, lien, or dispute (self-declared by the lister, not a title search)
        </span>
      )}
      {cacNumber && (
        <span className={`verification-badge ${cacVerified ? 'verification-badge-backed' : 'verification-badge-unbacked'}`}>
          <Building2 size={13} />
          {cacVerified ? `CAC #${cacNumber} (moderator-checked)` : `CAC #${cacNumber} (self-reported, not independently verified)`}
        </span>
      )}
      {professionalIndemnityInsurance && (
        <span className="verification-badge verification-badge-unbacked">
          <ShieldCheck size={13} />
          Carries professional indemnity insurance (self-declared, voluntary; not a legal requirement in Nigeria)
        </span>
      )}
    </div>
  )
}
