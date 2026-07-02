// Structured "facts & specifications" + grouped feature-tag taxonomy for
// listings — modeled on a competitor review (Afriqahome) that groups
// amenities into Infrastructure/Security/Amenities instead of one flat
// tag list, and shows plain-language title badges instead of a score.

export const TITLE_DOCUMENT_LABELS = {
  c_of_o: 'Certificate of Occupancy (C of O)',
  governors_consent: "Governor's Consent",
  deed_of_assignment: 'Deed of Assignment',
  none_yet: 'No title document yet'
}

// Same self-reported + moderator-verify posture as LASRERA/CAC numbers
// elsewhere in this app — a lister claiming "C of O" is not the same as
// a moderator having actually seen it, and the badge this drives must
// say which one is true. Never worded as a legal guarantee: KeyCheck
// has no e-GIS-style API integration (unlike Kenya's Ardhisasa, which
// is what a competitor's "Title Ready"/"Freehold" badges likely draw
// on) — see firestore.rules/VerificationBadge.jsx's existing discipline
// around not overclaiming backing that doesn't exist yet.
export function getTitleDocumentLabel(type) {
  return TITLE_DOCUMENT_LABELS[type] || null
}

export const AMENITY_GROUPS = [
  {
    key: 'infrastructure',
    label: 'Infrastructure',
    options: ['Borehole / running water', 'Generator / power backup', 'Internet-ready', 'Tarred road access']
  },
  {
    key: 'security',
    label: 'Security',
    options: ['Gated / guarded', 'CCTV', 'Perimeter fence', 'Alarm system']
  },
  {
    key: 'amenities',
    label: 'Amenities',
    options: ['Furnished', 'Garden', 'Balcony', 'Swimming pool', 'Gym', 'Air conditioning']
  }
]

// Flattened, e.g. for a compact icon row on a listing card.
export const ALL_AMENITIES = AMENITY_GROUPS.flatMap((g) => g.options)
