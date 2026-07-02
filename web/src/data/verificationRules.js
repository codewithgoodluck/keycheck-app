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
