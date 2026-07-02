// Encodes which states actually have a real, checkable regulatory
// registry backing a "verified" claim — as data, not per-component
// logic, so adding a second state later (if one ever gets an equivalent
// registry) is a data change, not a redesign. Absence of a state here is
// itself meaningful: it means no state-backed registry exists yet, and
// the UI must say so honestly rather than showing a badge that looks
// identical to a Lagos listing backed by actual law.
//
// Source: Lagos State Estate Agency Regulatory Law (LASRERA) — see
// https://lasrera.lagosstate.gov.ng/practitionerSearch.jsp. No other
// Nigerian state has an equivalent public practitioner registry as of
// this writing.
export const STATE_VERIFICATION = {
  Lagos: {
    lasrera: true,
    source: 'Lagos State Estate Agency Regulatory Law (LASRERA)',
    practitionerSearchUrl: 'https://lasrera.lagosstate.gov.ng/practitionerSearch.jsp'
  }
}

export function getVerificationInfo(state) {
  const rules = STATE_VERIFICATION[state]
  if (!rules) return { hasStateBacking: false }
  return { hasStateBacking: true, ...rules }
}

// Same LASRERA guidelines as STATE_VERIFICATION above, but a different
// claim (a specific fee number vs. registry backing) — kept as its own
// data/function pair rather than folded into getVerificationInfo, so
// FeeComplianceNote.jsx and VerificationBadge.jsx don't get conflated.
// `sale` applies to any sale-type listing regardless of property
// category — the existing `type` field doesn't cleanly separate land
// sales from other sales, and "split across multiple agents" isn't
// representable with one listing's single fee field, so this is a
// deliberate simplification, not a silently dropped detail.
export const LAGOS_FEE_CAPS = { rent: 10, sale: 15 }

export function getFeeCapInfo(state, transactionType, agencyFeePercent) {
  if (state !== 'Lagos') return { capApplies: false }
  const cap = LAGOS_FEE_CAPS[transactionType]
  if (cap == null) return { capApplies: false }
  return { capApplies: true, cap, exceeds: agencyFeePercent > cap }
}

export const DUAL_REP_LABELS = {
  seller_only: 'Represents the seller/landlord only',
  buyer_only: 'Represents the buyer/tenant only',
  both_disclosed: 'Represents both parties (disclosed)'
}

// Fixed list — states + FCT — used for the listing form's dropdown and
// anywhere else a Nigerian state needs picking. Not free text: the
// verification logic keys off this exact list, so a typo'd state name
// would silently fall through to "no backing" even for Lagos.
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
]
