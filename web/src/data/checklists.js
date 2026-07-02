// Pre-purchase checklists, one per existing report category (same keys as
// TYPE_LABELS in lib/format.js — deliberately not inventing new categories).
// `lagosOnly: true` items reference Lagos-specific regulatory bodies
// (LASRERA, the eGIS land portal) and must say so explicitly — these
// don't apply statewide across Nigeria, and the app's case data spans
// many states.

const LAND_ITEMS = [
  { id: 'cofo', text: 'You have seen the original Certificate of Occupancy (C of O), not just a photocopy.' },
  {
    id: 'cofo-verify',
    text: 'The C of O has been verified at the state Land Registry — for Lagos, use the eGIS portal.',
    externalLink: { label: 'Lagos eGIS land search', url: 'https://landonline.lagosstate.gov.ng/' },
    lagosOnly: true
  },
  { id: 'deed', text: 'The Deed of Assignment is properly registered, not just signed by both parties.' },
  {
    id: 'survey',
    text: 'The Survey Plan is registered with the Surveyor-General’s office and matches the plot’s actual boundaries.',
    externalLink: { label: 'Find an independent surveyor (NIESV Lagos)', url: 'https://www.niesvlagos.org/' },
    lagosOnly: true
  },
  { id: 'consent', text: 'Governor’s Consent has actually been obtained — "in process" is not the same as obtained.' },
  { id: 'search', text: 'You’ve searched the seller/agent’s name and this exact address on KeyCheck.' },
  { id: 'inspect', text: 'You will physically inspect the plot, with the document originals in hand, before paying in full.' },
  { id: 'receipt', text: 'You will get an official receipt for every payment — no "family receipt only" arrangements.' }
]

const RENTAL_ITEMS = [
  {
    id: 'lasrera',
    text: 'The agent’s LASRERA registration has been confirmed via the practitioner search.',
    externalLink: { label: 'LASRERA practitioner search', url: 'https://lasrera.lagosstate.gov.ng/practitionerSearch.jsp' },
    lagosOnly: true
  },
  { id: 'fee-cap', text: 'The agency fee does not exceed 10% of the annual rent.', lagosOnly: true },
  { id: 'advance-cap', text: 'You are not being asked for more than 1 year’s rent upfront.', lagosOnly: true },
  { id: 'inspect', text: 'You will physically inspect the property before making any payment.' },
  { id: 'receipt', text: 'You will get an official receipt for every payment.' },
  { id: 'pressure', text: 'You are not being pressured to pay today or "lose the place".' },
  { id: 'search', text: 'You’ve searched the agent/landlord’s name and this address on KeyCheck.' }
]

const ESTATE_ITEMS = [
  { id: 'cofo', text: 'You have seen the original Certificate of Occupancy or Governor’s Consent for the unit.' },
  { id: 'not-resold', text: 'You’ve confirmed, independently of the seller, that this exact unit hasn’t already been sold to someone else.' },
  { id: 'search', text: 'You’ve searched the developer/estate name on KeyCheck.' },
  { id: 'inspect', text: 'You will physically inspect the unit before paying in full.' },
  { id: 'payment', text: 'Payment terms are in writing — not a verbal promise or a cheque you haven’t confirmed clears.' }
]

export const CHECKLISTS = {
  land: LAND_ITEMS,
  agent: LAND_ITEMS,
  house_agent: RENTAL_ITEMS,
  landlord: RENTAL_ITEMS,
  estate: ESTATE_ITEMS
}
