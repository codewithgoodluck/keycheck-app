import { Landmark } from 'lucide-react'

// Lagos-specific — the Lagos State Tenancy Law 2011, Section 4(4) caps
// agency fees at 10% of total rent and bars landlords from demanding more
// than 1 year's rent in advance. This does not apply statewide across
// Nigeria, so the copy says so explicitly rather than implying it's a
// national rule.
export default function FeeCapFactBox() {
  return (
    <div className="fact-box">
      <Landmark size={18} />
      <div>
        <strong>Lagos State rent rules:</strong> agency fees are capped at{' '}
        <strong>10% of the total rent</strong>, and a landlord cannot legally demand more than{' '}
        <strong>1 year's rent upfront</strong> — Lagos State Tenancy Law 2011. Both are routinely
        ignored; you're allowed to say no.
      </div>
    </div>
  )
}
