import { AlertTriangle, Info, HelpCircle } from 'lucide-react'
import { getPriceComparison } from '../lib/priceComparison.js'

// Never labeled a "valuation" — only ESVARBON-licensed valuers may
// legally provide a formal valuation for a loan or court case. Every
// state below says "indicator" and includes the informal-data
// disclaimer explicitly, not left implicit.
export default function MarketPriceIndicator({ listing, listings }) {
  const comparison = getPriceComparison(listing, listings)

  let body
  if (!comparison.available) {
    body = (
      <span className="fee-note fee-note-neutral">
        <HelpCircle size={13} />
        Not enough comparable listings on KeyCheck yet to compare pricing.
      </span>
    )
  } else if (comparison.isLow) {
    body = (
      <span className="fee-note fee-note-warning">
        <AlertTriangle size={13} />
        ₦{Math.round(comparison.pricePerSqm).toLocaleString()}/sqm — well below the ₦
        {Math.round(comparison.median).toLocaleString()}/sqm median across {comparison.comparableCount} similar
        listings on KeyCheck. Unusually low prices are a common scam pattern — verify carefully before paying.
      </span>
    )
  } else {
    body = (
      <span className="fee-note fee-note-ok">
        <Info size={13} />
        ₦{Math.round(comparison.pricePerSqm).toLocaleString()}/sqm — in line with {comparison.comparableCount} similar
        listings on KeyCheck (median ₦{Math.round(comparison.median).toLocaleString()}/sqm).
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {body}
      <span className="fee-note fee-note-neutral" style={{ fontStyle: 'italic' }}>
        Informal market price indicator based on community listing data — not a professional valuation.
      </span>
    </div>
  )
}
